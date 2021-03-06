//region Constants

const FPS = 50
const SCALE  = 30 // affects how fast-paced the game is, forces should be adjusted as well
const VIEWPORT_W = 600
const VIEWPORT_H = 400

//let RENDERING_VIEWER_W = 2 * VIEWPORT_W
let RENDERING_VIEWER_W = 0.8 * window.innerWidth;
let RENDERING_VIEWER_H = VIEWPORT_H

const NB_LIDAR = 10
const LIDAR_RANGE = 160/SCALE

const INITIAL_RANDOM = 5

const TERRAIN_STEP   = 14/SCALE
const TERRAIN_LENGTH = 200     // in steps
const TERRAIN_HEIGHT = VIEWPORT_H/SCALE/4
const TERRAIN_END = 5;
const INITIAL_TERRAIN_STARTPAD = 20 // in steps
const FRICTION = 2.5
const WATER_DENSITY = 1.0
const CREEPER_UNIT = 1;
const NB_FIRST_STEPS_HANG = 5

//endregion

class ParametricContinuousParkour {

    constructor(agent_body_type, input_CPPN_dim=3, terrain_cppn_scale=10,
                ceiling_offset=200, ceiling_clip_offset=0, water_clip=20,
                movable_creepers=false, walker_args){

        // Seed and init Box2D
        //this.seed();
        this.scale = SCALE;
        this.zoom = 1;
        this.contact_listener = new ContactDetector(this);
        let gravity = new b2.Vec2(0, -10);
        this.world = new b2.World(gravity);
        this.world.SetContactListener(this.contact_listener);
        this.movable_creepers = movable_creepers;

        // Create agent
        // TODO: body types enum + walker_args
        if(agent_body_type == "classic_bipedal"){
            this.agent_body = new ClassicBipedalBody(SCALE, /*walker_args*/);
            this.set_lidars_type("down");
        }
        else if(agent_body_type == "climbing_profile_chimpanzee"){
            this.agent_body = new ClimbingProfileCHimpanzee(SCALE)
            this.set_lidars_type("up");
        }
        else {
            this.agent_body = new OldClassicBipedalBody(SCALE);
            this.set_lidars_type("down");
        }

        // Terrain and dynamics
        this.terrain_bodies = [];
        this.background_polys = []
        // TODO: handle kwargs + Climbing dynamics
        this.water_dynamics = new WaterDynamics(this.world.m_gravity /*, max_push=water_clip*/);
        this.climbing_dynamics = new ClimbingDynamics();
        this.prev_shaping = null;
        this.episodic_reward = 0;
        this.creepers_joints = [];

        if(this.agent_body.AGENT_WIDTH / TERRAIN_STEP + 5 <= INITIAL_TERRAIN_STARTPAD){
          this.TERRAIN_STARTPAD = INITIAL_TERRAIN_STARTPAD;
        }
        else{
            this.TERRAIN_STARTPAD = this.agent_body.AGENT_WIDTH / TERRAIN_STEP + 5;
        }
        this.create_terrain_fixtures();

        // TODO: Cppn init
        this.input_CPPN_dim = input_CPPN_dim;
        this.terrain_CPPN = new CPPN(TERRAIN_LENGTH, input_CPPN_dim);
        this.set_terrain_cppn_scale(terrain_cppn_scale, ceiling_offset, ceiling_clip_offset);

        // Set info / action spaces
        //this._generate_agent(); // To get state / action sizes
        //let agent_action_size = this.agent_body.get_action_size();
        //this.action_space =

        //let agent_state_size = this.agent_body.get_state_size();
        // let high = // TODO
        // this.observation_space = // TODO
    }

    // TODO
    seed(){

    }

    set_lidars_type(lidars_type){
        // Use 'down' for walkers, 'up' for climbers and 'full' for swimmers.
        if(lidars_type == "down") {
            this.lidar_angle = 1.5;
            this.lidar_y_offset = 0;
        }
        else if(lidars_type == "up") {
            this.lidar_angle = 2.3;
            this.lidar_y_offset = 1.5;
        }
        else if(lidars_type == "full") {
            this.lidar_angle = Math.PI;
            this.lidar_y_offset = 0;
        }
    }

    set_terrain_cppn_scale(terrain_cppn_scale, ceiling_offset, ceiling_clip_offset){
        /*
         * Scale the terrain generated by the Cppn to be more suited to our embodiments.
         */
        console.assert(terrain_cppn_scale > 1);
        this.TERRAIN_CPPN_SCALE = terrain_cppn_scale;
        this.CEILING_LIMIT = 1000 / this.TERRAIN_CPPN_SCALE;
        this.GROUND_LIMIT = -1000 / this.TERRAIN_STARTPAD;
        this.ceiling_offset = ceiling_offset / this.TERRAIN_CPPN_SCALE;
        this.ceiling_clip_offset = ceiling_clip_offset / this.TERRAIN_CPPN_SCALE;
    }

    set_environment(input_vector, water_level, creepers_width=null,
                    creepers_height=null, creepers_spacing=0.1, terrain_cppn_scale=10, movable_creepers){
        /*
         * Set the parameters controlling the PCG algorithm to generate a task.
         * Call this method before `reset()`.
         */
        this.CPPN_input_vector = input_vector;
        this.water_level = water_level > 0 ? water_level : - 0.01;
        this.creepers_width = creepers_width;
        this.creepers_height = creepers_height;
        this.creepers_spacing = Math.max(0.01, creepers_spacing);
        this.movable_creepers = movable_creepers;
        this.set_terrain_cppn_scale(terrain_cppn_scale,
                        this.ceiling_offset * this.TERRAIN_CPPN_SCALE,
                                    this.ceiling_clip_offset * this.TERRAIN_CPPN_SCALE);
    }

    _destroy(){
        this.world.SetContactListener(null);
        for(let t of this.terrain_bodies){
            this.world.DestroyBody(t);
        }
        this.terrain_bodies = [];
        this.creepers_joints = [];
        this.agent_body.destroy(this.world);
    }

    reset(){
        this._destroy();
        this.contact_listener = new ContactDetector(this);
        this.world.SetContactListener(this.contact_listener);
        this.critical_contact = false;
        this.prev_shaping = null;
        this.scroll = [0, 0];
        this.water_y = this.GROUND_LIMIT;
        this.nb_steps_outside_water = 0;
        this.nb_steps_under_water = 0;

        this.generate_game();

        this.lidar = [];
        for(let i = 0; i < NB_LIDAR; i++){
            this.lidar.push(new LidarCallback(this.agent_body.reference_head_object.GetFixtureList().GetFilterData().maskBits));
        }

        let actions_to_play = Array.from({length: this.agent_body.get_action_size()}, () => 0);

        // If embodiment is a climber, make it start hanging on the ceiling using a few steps to let the Box2D solver handle positions.
        if(this.agent_body.body_type == BodyTypesEnum.CLIMBER){
            this.init_climber_pos(actions_to_play);
        }

        let initial_state = this.step(actions_to_play)[0];
        this.nb_steps_outside_water = 0;
        this.nb_steps_under_water = 0;
        this.episodic_reward = 0;
        return initial_state;
    }

    init_climber_pos(actions_to_play){
        // Init climber
        let y_diff = 0;
        for(let i = 0; i < this.agent_body.sensors.length; i++){
            actions_to_play[actions_to_play.length - i - 1] = 1;
            // Hang sensor
            let sensor = this.agent_body.sensors[this.agent_body.sensors.length - i - 1];
            let sensor_position = sensor.GetPosition();
            let idx = Math.round(sensor_position.x / ((TERRAIN_LENGTH + this.TERRAIN_STARTPAD) * TERRAIN_STEP) * (TERRAIN_LENGTH + this.TERRAIN_STARTPAD));
            if(y_diff == 0){
                y_diff = this.terrain_ceiling_y[idx] - sensor_position.y;
                //y_diff = TERRAIN_HEIGHT + this.ceiling_offset - sensor_position.y;
            }
            sensor.SetTransform(new b2.Vec2(sensor_position.x, this.terrain_ceiling_y[idx]),
                sensor.GetAngle());
        }

        for(let body_part of this.agent_body.body_parts){
            let body_part_pos = body_part.GetPosition();
            body_part.SetTransform(new b2Vec2(body_part_pos.x, body_part_pos.y + y_diff),
                body_part.GetAngle());
        }

        for(let i = 0; i < NB_FIRST_STEPS_HANG; i++){
            this.step(actions_to_play);
        }
    }

    step(action){
        // TODO: Only works for non-swimmer morphologies
        // Check if agent is dead
        let is_agent_dead = false;
        if((this.nb_steps_under_water > this.agent_body.nb_steps_can_survive_under_water)
            /*|| (this.nb_steps_outside_water > this.agent_body.nb_steps_can_survive_outside_water)*/){
            is_agent_dead = true;
            action = Array.from({length: this.agent_body.motors.length}, () => 0);
        }
        this.agent_body.activate_motors(action);

        // Prepare climbing dynamics according to the actions (i.e. sensor ready to grasp or sensor release destroying joint)
        // TODO: climbing dynamics
        if(this.agent_body.body_type == BodyTypesEnum.CLIMBER){
            this.climbing_dynamics.before_step_climbing_dynamics(action, this.agent_body, this.world);
        }

        this.world.Step(1.0 / FPS, 6 * 30, 2 * 30);
        //this.render();

        // Create joints between sensors ready to grasp if collision with graspable area was detected
        if(this.agent_body.body_type == BodyTypesEnum.CLIMBER){
            this.climbing_dynamics.after_step_climbing_dynamics(this.world.m_contactManager.m_contactListener.climbing_contact_detector, this.world);
        }

        // Calculate water physics
        this.water_dynamics.calculate_forces(this.world.m_contactManager.m_contactListener.water_contact_detector.fixture_pairs);

        let head = this.agent_body.reference_head_object;
        let pos = head.GetPosition();
        let vel = head.GetLinearVelocity();

        this.update_lidars(pos);

        let is_under_water = pos.y <= this.water_y;
        if(!is_agent_dead){
            if(is_under_water){
                this.nb_steps_under_water += 1;
                this.nb_steps_outside_water = 0;
            }
            else{
                this.nb_steps_under_water = 0;
                this.nb_steps_outside_water += 1;
            }
        }

        let state = [
            head.GetAngle(), // Normal angles up to 0.5 here, but sure more is possible.
            2.0 * head.GetAngularVelocity() / FPS,
            0.3 * vel.x * (VIEWPORT_W / SCALE) / FPS, // Normalized to get [-1, 1] range
            0.3 * vel.y * (VIEWPORT_H / SCALE) / FPS,
            is_under_water ? 1.0 : 0.0,
            is_agent_dead ? 1.0 : 0.0
        ];

        // add leg-related state
        state = state.concat(this.agent_body.get_motors_state());

        // add sensor-related state
        // TODO
        if(this.agent_body.body_type == BodyTypesEnum.CLIMBER){
            state = state.concat(this.agent_body.get_sensors_state());
        }

        // add lidar-related state with distance and surface detected
        let nb_of_water_detected = 0;
        let surface_detected = [];
        for(let lidar of this.lidar){
            state.push(lidar.fraction);
            if(lidar.is_water_detected){
                surface_detected.push(-1);
                nb_of_water_detected += 1;
            }

            else if(lidar.is_creeper_detected){
                surface_detected.push(1)
            }
            else{
                surface_detected.push(0);
            }
        }

        state = state.concat(surface_detected)

        // Update scroll to stay centered on the agent position
        /*if(window.follow_agent){
            this.scroll = [
                pos.x * this.scale * this.zoom - RENDERING_VIEWER_W/5,
                pos.y * this.scale * this.zoom - RENDERING_VIEWER_H/3
            ];
        }*/

        let shaping = 130 * pos.x / SCALE; // moving forward is a way to receive reward (normalized to get 300 on completion)
        // TODO: check if has attribute remove_reward_on_head_angle
        if(this.agent_body.remove_reward_on_head_angle){
            shaping -= 5.0 * Math.abs(state[0]); // keep head straight, other than that and falling, any behavior is unpunished
        }

        let reward = 0;
        if(this.prev_shaping != null){
            reward = shaping - this.prev_shaping;
        }
        this.prev_shaping = shaping;

        for(let a of action){
            reward -= this.agent_body.TORQUE_PENALTY * 80 * Math.max(0, Math.min(Math.abs(a), 1));
            // normalized to about -50.0 using heuristic, more optimal agent should spend less
        }

        // Ending conditions
        let done = false;
        if(this.critical_contact || pos.x < 0){
            reward -= 100;
            done = true;
        }
        if(pos.x > (TERRAIN_LENGTH + this.TERRAIN_STARTPAD - TERRAIN_END) * TERRAIN_STEP){
            done = true;
        }
        this.episodic_reward += reward;

        return [state, reward, done, {"success": this.episodic_reward > 230}];
        //return [[], 0, false, {"success": false}];
    }

    update_lidars(pos){
        for(let i = 0; i < NB_LIDAR; i++){
            this.lidar[i].fraction = 1.0;
            this.lidar[i].p1 = pos;
            this.lidar[i].p2 = new b2.Vec2(
                pos.x + Math.sin(this.lidar_angle * i / NB_LIDAR + this.lidar_y_offset) * LIDAR_RANGE,
                pos.y - Math.cos(this.lidar_angle * i / NB_LIDAR + this.lidar_y_offset) * LIDAR_RANGE
            );
            this.world.RayCast(this.lidar[i], this.lidar[i].p1, this.lidar[i].p2);
        }
    }

    close(){
        this.world.SetContactListener(null);
        this.contact_listener.Reset();
        this._destroy();
    }

    // region Rendering
    // ------------------------------------------ RENDERING ------------------------------------------

    color_agent_head(c1, c2){
        /*
         * Color agent's head depending on its 'dying' state.
         */
        let ratio = 0;
        if(this.agent_body.nb_steps_can_survive_under_water){
            ratio = this.nb_steps_under_water / this.agent_body.nb_steps_can_survive_under_water;
        }

        let color1 = [
            c1[0] + ratio * (1.0 - c1[0]),
            c1[1] + ratio * (0.0 - c1[1]),
            c1[2] + ratio * (0.0 - c1[2])
        ]
        let color2 = c2;
        return [color1, color2];
    }

    render() {
        // call p5.js draw function once
        redraw();
    }

    _SET_RENDERING_VIEWPORT_SIZE(width, height=null, keep_ratio=true){
        RENDERING_VIEWER_W = width;
        if(keep_ratio || height == null){
            RENDERING_VIEWER_H = Math.floor(RENDERING_VIEWER_W / (2 * VIEWPORT_W / VIEWPORT_H));
        }
        else{
            RENDERING_VIEWER_H = height;
        }
    }
    //endregion

    //region Fixtures Initialization
    // ------------------------------------------ FIXTURES INITIALIZATION ------------------------------------------

    create_terrain_fixtures(){

        // Polygon fixture
        this.fd_polygon = new b2.FixtureDef();
        this.fd_polygon.shape = new b2.PolygonShape();
        let vertices = [
            new b2.Vec2(0, 0),
            new b2.Vec2(1, 0),
            new b2.Vec2(1, -1),
            new b2.Vec2(0, -1)];
        this.fd_polygon.shape.Set(vertices, 4);
        this.fd_polygon.friction = FRICTION;
        this.fd_polygon.filter.categoryBits = 0x1;
        this.fd_polygon.filter.maskBits = 0xFFFF;

        // Edge fixture
        this.fd_edge = new b2.FixtureDef();
        this.fd_edge.shape = new b2.EdgeShape();
        this.fd_edge.shape.Set(new b2.Vec2(0, 0), new b2.Vec2(1, 1));
        this.fd_edge.friction = FRICTION;
        this.fd_edge.filter.categoryBits = 0x1;
        this.fd_edge.filter.maskBits = 0xFFFF;

        // Water fixture
        this.fd_water = new b2.FixtureDef();
        this.fd_water.shape = new b2.PolygonShape();
        vertices = [
            new b2.Vec2(0, 0),
            new b2.Vec2(1, 0),
            new b2.Vec2(1, -1),
            new b2.Vec2(0, -1)];
        this.fd_water.shape.Set(vertices, 4);
        this.fd_water.density = WATER_DENSITY;
        this.fd_water.isSensor = true;

        // Creeper fixture
        this.fd_creeper = new b2.FixtureDef();
        this.fd_creeper.shape = new b2.PolygonShape();
        vertices = [
            new b2.Vec2(0, 0),
            new b2.Vec2(1, 0),
            new b2.Vec2(1, -1),
            new b2.Vec2(0, -1)];
        this.fd_creeper.shape.Set(vertices, 4);
        this.fd_creeper.density = 5.0;
        this.fd_creeper.isSensor = true;

    }
    //endregion

    // region Game Generation
    // ------------------------------------------ GAME GENERATION ------------------------------------------

    generate_game(){
        this._generate_terrain();
        this._generate_clouds();
        this._generate_agent();
    }

    clip_ceiling_values(row, clip_offset){
        if(row["ceiling"] >= row["ground"] + clip_offset){
            return row["ceiling"];
        }
        else{
            return row["ground"] + clip_offset;
        }
    }

    _generate_terrain(){
        let y = this.terrain_CPPN.generate(this.CPPN_input_vector).arraySync();

        // TODO: check that maps are correct
        y = y.map(e => [e[0] / this.TERRAIN_CPPN_SCALE, e[1] / this.TERRAIN_CPPN_SCALE]);
        let ground_y = y.map(e => e[0]);
        let ceiling_y = y.map(e => e[1]);

        // Align ground with startpad
        let offset = TERRAIN_HEIGHT - ground_y[0];
        ground_y = ground_y.map(e => e + offset);

        // Align ceiling from startpad ceiling
        offset = TERRAIN_HEIGHT + this.ceiling_offset - ceiling_y[0];
        ceiling_y = ceiling_y.map(e => e + offset);

        this.terrain_x = [];
        this.terrain_ground_y = [];
        this.terrain_ceiling_y = [];
        this.terrain_creepers = [];
        let x = 0;
        let max_x = x + (TERRAIN_LENGTH + this.TERRAIN_STARTPAD) * TERRAIN_STEP;

        // Generation of the terrain
        let i = 0;
        while(x < max_x){
            this.terrain_x.push(x);

            if(i < this.TERRAIN_STARTPAD){
                this.terrain_ground_y.push(TERRAIN_HEIGHT);
                this.terrain_ceiling_y.push(TERRAIN_HEIGHT + this.ceiling_offset);
            }
            else{
                this.terrain_ground_y.push(ground_y[i - this.TERRAIN_STARTPAD]);

                // Clip ceiling
                let ceiling_val = ground_y[i - this.TERRAIN_STARTPAD] + this.ceiling_clip_offset;
                if(ceiling_y[i - this.TERRAIN_STARTPAD] >= ceiling_val){
                    ceiling_val = ceiling_y[i - this.TERRAIN_STARTPAD];
                }
                this.terrain_ceiling_y.push(ceiling_val);
            }

            x += TERRAIN_STEP;
            i += 1;
        }

        // Draw terrain
        let space_from_precedent_creeper = this.creepers_spacing;

        this.terrain_bodies = [];
        this.background_polys = [];
        let poly;
        let poly_data;

        // Water
        // Fill water from GROUND_LIMIT to highest point of the current ceiling
        //let air_max_distance = Math.max(...this.terrain_ceiling_y) - this.GROUND_LIMIT;
        //this.water_y = this.GROUND_LIMIT + this.water_level * air_max_distance;

        this.min_ground_y = Math.min(...this.terrain_ground_y);
        this.air_max_distance = Math.max(...this.terrain_ceiling_y) - this.min_ground_y;
        this.water_y = Math.min(...this.terrain_ground_y) + this.water_level * this.air_max_distance;

        let water_poly = [
            [this.terrain_x[0], this.GROUND_LIMIT],
            [this.terrain_x[0], this.water_y],
            [this.terrain_x[this.terrain_x.length - 1], this.water_y],
            [this.terrain_x[this.terrain_x.length - 1], this.GROUND_LIMIT]
        ];
        this.fd_water.shape.Set([new b2.Vec2(water_poly[0][0], water_poly[0][1]),
                new b2.Vec2(water_poly[1][0], water_poly[1][1]),
                new b2.Vec2(water_poly[2][0], water_poly[2][1]),
                new b2.Vec2(water_poly[3][0], water_poly[3][1])],
            4);
        let body_def = new b2.BodyDef();
        body_def.type = b2.Body.b2_staticBody;
        let t = this.world.CreateBody(body_def);
        t.CreateFixture(this.fd_water);
        t.SetUserData(new CustomUserData("water", CustomUserDataObjectTypes.WATER));
        let color = "#77ACE5"; // [0.465, 0.676, 0.898];
        this.water_poly = {
            type : "water",
            color: color,
            vertices: water_poly,
            body : t
        };
        //this.terrain_bodies.push(water_poly);

        // Ground, ceiling and creepers bodies
        for(let i = 0; i < this.terrain_x.length - 1; i++){

            // Ground
            poly = [
                [this.terrain_x[i], this.terrain_ground_y[i]],
                [this.terrain_x[i + 1], this.terrain_ground_y[i + 1]]
            ];
            this.fd_edge.shape.Set(new b2.Vec2(poly[0][0], poly[0][1]),
                                   new b2.Vec2(poly[1][0], poly[1][1]));
            let body_def = new b2.BodyDef();
            body_def.type = b2.Body.b2_staticBody;
            let t = this.world.CreateBody(body_def);
            t.CreateFixture(this.fd_edge);
            t.SetUserData(new CustomUserData("grass", CustomUserDataObjectTypes.TERRAIN));
            let color = i % 2 == 0 ? "#4dff4d" : "#4dcc4d"; // [0.3, 1.0, 0.3] : [0.3, 0.8, 0.3]
            poly_data = {
                type : "ground",
                color : color,
                body : t,
            }
            this.terrain_bodies.push(poly_data);

            // Visual poly to fill the ground
            if(i <= this.terrain_x.length / 2){
                poly.push([poly[1][0] + 10 * TERRAIN_STEP, 2 * this.GROUND_LIMIT]);
                poly.push([poly[0][0], 2 * this.GROUND_LIMIT]);
            }
            else{
                poly.push([poly[1][0], 2 * this.GROUND_LIMIT]);
                poly.push([poly[0][0] - 10 * TERRAIN_STEP, 2 * this.GROUND_LIMIT]);
            }

            color = "#66994D"; //[0.4, 0.6, 0.3];
            poly_data = {
                type : "ground",
                color : color,
                vertices : poly,
            }
            this.background_polys.push(poly_data);

            // Ceiling
            poly = [
                [this.terrain_x[i], this.terrain_ceiling_y[i]],
                [this.terrain_x[i + 1], this.terrain_ceiling_y[i + 1]]
            ];
            this.fd_edge.shape.Set(new b2.Vec2(poly[0][0], poly[0][1]),
                                   new b2.Vec2(poly[1][0], poly[1][1]));
            body_def = new b2.BodyDef();
            body_def.type = b2.Body.b2_staticBody;
            t = this.world.CreateBody(body_def);
            t.CreateFixture(this.fd_edge);
            t.SetUserData(new CustomUserData("rock", CustomUserDataObjectTypes.GRIP_TERRAIN)); // TODO: CustomUserData
            color = "#004040"; // [0, 0.25, 0.25];
            poly_data = {
                type : "ceiling",
                color : color,
                body : t,
            }
            this.terrain_bodies.push(poly_data);

            // Visual poly to fill the ceiling
            if(i <= this.terrain_x.length / 2){
                poly.push([poly[1][0] + 10 * TERRAIN_STEP, 2 * this.CEILING_LIMIT]);
                poly.push([poly[0][0], 2 * this.CEILING_LIMIT]);
            }
            else{
                poly.push([poly[1][0], 2 * this.CEILING_LIMIT]);
                poly.push([poly[0][0] - 10 * TERRAIN_STEP, 2 * this.CEILING_LIMIT]);
            }
            color = "#808080"; // [0.5, 0.5, 0.5];
            poly_data = {
                type : "ceiling",
                color : color,
                vertices : poly,
            }
            this.background_polys.push(poly_data);

            // Creepers
            if(this.creepers_width != null && this.creepers_height != null){
                if(space_from_precedent_creeper >= this.creepers_spacing){

                    let creeper_height = Math.max(0.2, Math.random() * (this.creepers_height - 0.1) + 0.1);
                    let creeper_width = Math.max(0.2, this.creepers_width);
                    let creeper_step_size = Math.max(1, Math.floor(creeper_width / TERRAIN_STEP));
                    let creeper_y_init_pos = Math.max(this.terrain_ceiling_y[i],
                                                      this.terrain_ceiling_y[Math.min(i + creeper_step_size, this.terrain_x.length - 1)]);
                    if(this.movable_creepers){ // Break creepers in multiple objects linked by joints
                        let previous_creeper_part = t;

                        // cut the creeper in unit parts
                        for(let w = 0; w < Math.ceil(creeper_height); w++){
                            let h;
                            // last iteration: rest of the creeper
                            if(w == Math.floor(creeper_height / CREEPER_UNIT)){
                                h = Math.max(0.2, creeper_height % CREEPER_UNIT);
                            }
                            else{
                                h = CREEPER_UNIT;
                            }

                            this.fd_creeper.shape.SetAsBox(creeper_width/2, h/2);
                            body_def = new b2.BodyDef();
                            body_def.type = b2.Body.b2_dynamicBody;
                            body_def.position.Set(this.terrain_x[i] + creeper_width/2, creeper_y_init_pos - (w * CREEPER_UNIT) - h/2);
                            t = this.world.CreateBody(body_def);
                            t.CreateFixture(this.fd_creeper);
                            t.SetUserData(new CustomUserData("creeper", CustomUserDataObjectTypes.SENSOR_GRIP_TERRAIN));
                            color = "#6F8060"; // [0.437, 0.504, 0.375];
                            poly_data = {
                                type : "creeper",
                                color1 : color,
                                color2 : color,
                                body : t,
                            }
                            this.terrain_bodies.push(poly_data);

                            let rjd_def = new b2.RevoluteJointDef();
                            let anchor = new b2.Vec2(this.terrain_x[i] + creeper_width/2, creeper_y_init_pos - (w * CREEPER_UNIT));
                            rjd_def.Initialize(previous_creeper_part, t, anchor);
                            rjd_def.enableMotor = false;
                            rjd_def.enableLimit = true;
                            rjd_def.lowerAngle = -0.4 * Math.PI;
                            rjd_def.upperAngle = 0.4 * Math.PI;
                            let joint = this.world.CreateJoint(rjd_def);
                            joint.SetUserData(new CustomMotorUserData("creeper", 6, false));
                            this.creepers_joints.push(joint);
                            previous_creeper_part = t;
                        }
                    }
                    else{
                        this.fd_creeper.shape.SetAsBox(creeper_width/2, creeper_height/2);
                        body_def = new b2.BodyDef();
                        body_def.type = b2.Body.b2_staticBody;
                        body_def.position.Set(this.terrain_x[i] + creeper_width/2, creeper_y_init_pos - creeper_height/2);
                        t = this.world.CreateBody(body_def);
                        t.CreateFixture(this.fd_creeper);
                        t.SetUserData(new CustomUserData("creeper", CustomUserDataObjectTypes.SENSOR_GRIP_TERRAIN));
                        color = "#6F8060"; // [0.437, 0.504, 0.375];
                        poly_data = {
                            type : "creeper",
                            color1 : color,
                            body : t,
                        }
                        this.terrain_bodies.push(poly_data);
                    }
                    space_from_precedent_creeper = 0;
                }
                else{
                    space_from_precedent_creeper += this.terrain_x[i] - this.terrain_x[i - 1]
                }
            }
        }
    }

    _generate_clouds(){
        this.cloud_polys = [];
        for(let i = 0; i < Math.ceil(TERRAIN_LENGTH/20); i++){
          let x = (Math.random() * 3 * TERRAIN_LENGTH - TERRAIN_LENGTH) * TERRAIN_STEP;
          let y = Math.random() * RENDERING_VIEWER_H/SCALE + RENDERING_VIEWER_H/SCALE * 2/5;
          let poly = [];
          for(let a = 0; a < 10; a++){
            poly.push([
                x + 15 * TERRAIN_STEP * Math.sin(Math.PI * 2 * a / 5) + Math.random() * (0 - 5 * TERRAIN_STEP) + 5 * TERRAIN_STEP,
                y + 5 * TERRAIN_STEP * Math.cos(Math.PI * 2 * a / 5) + Math.random() * (0 - 5 * TERRAIN_STEP) + 5 * TERRAIN_STEP
            ])
          }
          let x1 = Math.min(...poly.map(p => p[0]));
          let x2 = Math.max(...poly.map(p => p[0]));
          this.cloud_polys.push({poly: poly, x1: x1, x2: x2});
        }
    }

    _generate_agent(init_x=null, init_y=null, set_pos=false){

        if(init_x == null){
            init_x = TERRAIN_STEP * this.TERRAIN_STARTPAD / 2;
        }

        if(init_y == null){
            init_y = TERRAIN_HEIGHT + this.agent_body.AGENT_CENTER_HEIGHT; // set y position according to the agent
        }

        this.agent_body.draw(this.world, init_x, init_y, 0 /*Math.random() * 2 * INITIAL_RANDOM - INITIAL_RANDOM*/);

        if(set_pos && this.agent_body.body_type == BodyTypesEnum.CLIMBER){
            this.init_climber_pos(Array.from({length: this.agent_body.get_action_size()}, () => 0));
        }
    }


    set_agent_position(x) {
        this.agent_body.destroy(this.world);
        let init_x = x * (TERRAIN_LENGTH + this.TERRAIN_STARTPAD) * TERRAIN_STEP;
        let init_y;
        let idx = x < 1 ? Math.floor(x * (TERRAIN_LENGTH + this.TERRAIN_STARTPAD)) : TERRAIN_LENGTH + this.TERRAIN_STARTPAD - 1;

        if (this.agent_body.body_type == BodyTypesEnum.CLIMBER) {
            init_y = null;
        } else if (this.agent_body.body_type == BodyTypesEnum.WALKER) {
            init_y = this.terrain_ground_y[idx] + this.agent_body.AGENT_CENTER_HEIGHT;
        }

        this._generate_agent(init_x, init_y, true);

        if (this.agent_body.body_type != BodyTypesEnum.CLIMBER) {
            this.step(Array.from({length: this.agent_body.get_action_size()}, () => 0));
        }
    }

    set_scroll(h=null, v=null){
        if(window.follow_agent){
            this.scroll = [
                this.agent_body.reference_head_object.GetPosition().x * this.scale * this.zoom - RENDERING_VIEWER_W/5,
                this.agent_body.reference_head_object.GetPosition().y * this.scale * this.zoom - RENDERING_VIEWER_H/3
            ];
        }
        else{
            this.scroll = [
                parseFloat(h)/100 * ((TERRAIN_LENGTH + this.TERRAIN_STARTPAD) * TERRAIN_STEP * this.scale * this.zoom - RENDERING_VIEWER_W * 0.9) - RENDERING_VIEWER_W * 0.05,
                parseFloat(v)/100 * this.air_max_distance/2 * this.scale * this.zoom
                //parseFloat(v)/100 * RENDERING_VIEWER_H
            ];
        }
    }

    set_zoom(zoom){
        this.zoom = parseFloat(zoom);
    }

    //endregion
}