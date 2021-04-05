//region Constants

const FPS = 50
const SCALE  = 30 // affects how fast-paced the game is, forces should be adjusted as well
const VIEWPORT_W = 600
const VIEWPORT_H = 400

let RENDERING_VIEWER_W = 2 * VIEWPORT_W
let RENDERING_VIEWER_H = VIEWPORT_H

const NB_LIDAR = 10
const LIDAR_RANGE = 160/SCALE

const INITIAL_RANDOM = 5

const TERRAIN_STEP   = 14/SCALE
const TERRAIN_LENGTH = 200     // in steps
const TERRAIN_HEIGHT = VIEWPORT_H/SCALE/4
const TERRAIN_GRASS = 10    // low long are grass spots, in steps
const INITIAL_TERRAIN_STARTPAD = 20 // in steps
const TERRAIN_END = 5;
const FRICTION = 2.5

const WATER_DENSITY = 1.0
const CREEPER_UNIT = 1;
const NB_FIRST_STEPS_HANG = 5

//endregion

class ParametricContinuousFlatParkour {
    // TODO: metadata ?

    constructor(water_level, config/*, agent_body_type*/, lidars_type="down"){

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

        this.seed();
        this.viewer = null;
        this.config = config;
        /*this.main_screen = document.getElementById(config.canvas_id);
        if(this.main_screen){
            this.ctx = this.main_screen.getContext("2d");
        }*/
        this.scale = SCALE;
        this.zoom = 1;
        this.render_change = true;

        let gravity = new b2.Vec2(0, -10);
        this.world = new b2.World(gravity);
        this.terrain = [];
        this.creepers_joints = [];
        this.water_dynamics = new WaterDynamics(this.world.m_gravity);
        this.water_level = water_level;
        //this.climbing_dynamics = ClimbingDynamics();

        this.prev_shaping = null;

        // Create Walker
        this.agent_body = new OldClassicBipedalBody(SCALE);
        //this.agent_body = new ClassicBipedalBody(SCALE);

        if(this.agent_body.AGENT_WIDTH / TERRAIN_STEP + 5 <= INITIAL_TERRAIN_STARTPAD){
            this.TERRAIN_STARTPAD = INITIAL_TERRAIN_STARTPAD;
        }
        else{
            this.TERRAIN_STARTPAD = this.agent_body.AGENT_WIDTH / TERRAIN_STEP + 5;
        }

        this.create_terrain_fixtures();

        // Set info / action spaces
        let agent_action_size = this.agent_body.get_action_size();
        //this.action_space =

        let agent_state_size = this.agent_body.get_state_size();
        // let high = // TODO
        // this.observation_space = // TODO
    }

    // TODO
    seed(){

    }

    set_environment(creepers_size=null, creepers_width=null, creepers_height=null, creepers_spacing=null){
        this.climbing_surface_size = creepers_size/SCALE;
        if(creepers_size != null){
            this.creepers = false;
        }
        else{
            this.creepers = true;
            this.creepers_width = creepers_width/SCALE;
            this.creepers_height = [creepers_height/SCALE, CREEPER_UNIT];
            this.creepers_spacing = Math.max(1/SCALE, creepers_spacing/SCALE);
        }
    }

    _destroy(){
        this.world.contactListener = null;
        for(let t of this.terrain){
            this.world.DestroyBody(t);
        }
        this.terrain = [];
        this.creepers_joints = [];
        this.agent_body.destroy(this.world);
    }

    reset(){
        this._destroy();
        this.world.contactListener_bug_workaround = new ContactDetector(this);
        this.world.SetContactListener(this.world.contactListener_bug_workaround);
        this.critical_contact = false;
        this.prev_shaping = null;
        this.scroll_offset = - 0.05 * RENDERING_VIEWER_W;
        this.lidar_render = 0;
        this.water_y = this.water_level * VIEWPORT_H/SCALE;

        this.generate_game();

        this.lidar = [];
        for(let i = 0; i < NB_LIDAR; i++){
            this.lidar.push(new LidarCallback(this.agent_body.reference_head_object.GetFixtureList().GetFilterData().maskBits));
        }

        // TODO
        let actions_to_play = Array.from({length: this.agent_body.motors.length}, () => 0);
        /*if(this.agent_bod.body_type == BodyTypesEnum.CLIMBER){
            // Init climber
            let y_diff = 0;
            for(let i = 0; i < this.agent_body.sensors.length; i++){
               //...
            }
        }*/

        let initial_state = this.step(actions_to_play)[0];
        this.nb_steps_outside_water = 0;
        this.nb_steps_under_water = 0;
        this.episodic_reward = 0;
        return initial_state;
    }

    step(action){
        // TODO: Only works for non-swimmer morphologies
        let is_agent_dead = false;
        if(this.nb_steps_under_water > this.agent_body.nb_steps_can_survive_under_water){
            is_agent_dead = true;
            action = Array.from({length: this.agent_body.motors.length}, () => 0);
        }
        this.agent_body.activate_motors(action);

        /*if(this.agent_body.body_type == BodyTypesEnum.CLIMBER){
            this.climbing_dynamics.before_step_climbing_dynamics(action, this.agent_body, this.world)
        }*/

        //this.world.Step(1.0 / 60, 10, 10);
        this.world.Step(1.0 / FPS, 6 * 30, 2 * 30);

        /*if(this.agent_body.body_type == BodyTypesEnum.CLIMBER){
            this.climbing_dynamics.after_step_climbing_dynamics(this.world.contactListener, this.world);
        }*/

        this.water_dynamics.calculate_forces(this.world.m_contactManager.m_contactListener.water_contact_detector.fixture_pairs);

        let head = this.agent_body.reference_head_object;
        let pos = head.GetPosition();
        let vel = head.GetLinearVelocity();

        for(let i = 0; i < NB_LIDAR; i++){
            this.lidar[i].fraction = 1.0;
            this.lidar[i].p1 = pos;
            this.lidar[i].p2 = new b2.Vec2(
                pos.x + Math.sin(this.lidar_angle * i / NB_LIDAR + this.lidar_y_offset) * LIDAR_RANGE,
                pos.y - Math.cos(this.lidar_angle * i / NB_LIDAR + this.lidar_y_offset) * LIDAR_RANGE
            );
            this.world.RayCast(this.lidar[i], this.lidar[i].p1, this.lidar[i].p2);
        }

        // TODO:STATE, REWARD
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
            2.0 * head.GetAngularVelocity() / FPS, // Normalized to get [-1, 1] range
            0.3 * vel.x * (VIEWPORT_W / SCALE) / FPS,
            0.3 * vel.y * (VIEWPORT_H / SCALE) / FPS,
            is_under_water ? 1.0 : 0.0,
            is_agent_dead ? 1.0 : 0.0
        ];

        // add leg-related state
        state = state.concat(this.agent_body.get_motors_state());

        /*if(this.agent_body.body_type == BodyTypesEnum.CLIMBER){
            state = state.concat(this.agent_body.get_sensors_state());
        }*/

        let nb_of_water_detected = 0;
        let surface_detected = [];
        for(let lidar of this.lidar){
            state.push(lidar.fraction);
            if(lidar.is_water_detected){
                surface_detected.push(-1);
                nb_of_water_detected += 1;
            }
            // TODO: is_creeper_detected
            else{
                surface_detected.push(0);
            }
        }
        //state.push(nb_of_water_detected / NB_LIDAR); // percentage of lidars that detect water
        state = state.concat(surface_detected)

        if(window.follow_agent){
            this.scroll_offset = pos.x * SCALE * this.zoom - RENDERING_VIEWER_W/5;
        }

        let shaping = 130 * pos.x / SCALE;
        // TODO: remove_reward_on_head_angle

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

        return [state, reward, done, {"success": false}]
    }

    render() {
        // call p5.js draw function once
        redraw();
    }

    close(){
        this._destroy();
        if(this.viewer != null){
            this.viewer.close();
            this.viewer = null;
        }
    }


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
        this.fd_creeper.isSensor = true;

    }
    //endregion

    // region Game Generation
    // ------------------------------------------ GAME GENERATION ------------------------------------------

    generate_game(){
        this._generate_terrain();
        //this._generate_clouds();
        this._generate_agent();
    }

    _generate_terrain(){
        this.terrain = [];
        this.terrain_x = [];
        this.terrain_y = [];
        let x = 0;
        let max_x = x + TERRAIN_LENGTH * TERRAIN_STEP;
        let poly;

        let space_from_precedent_creeper;
        if(this.creepers){
            space_from_precedent_creeper = this.creepers_spacing;
        }

        // Generation of the terrain
        while(x < max_x){
            this.terrain_x.push(x);
            let offset = 0;
            if(x > this.TERRAIN_STARTPAD){
                offset = (Math.random() * 20 - 10)/SCALE
            }
            this.terrain_y.push(TERRAIN_HEIGHT + offset);
            x += TERRAIN_STEP;
        }

        // Draw terrain
        this.terrain_bodies = [];
        this.background_polys = [];
        let poly_data;
        console.assert(this.terrain_x.length == this.terrain_y.length);

        // Sky
        poly = [
            [0, 0],
            [0, RENDERING_VIEWER_H],
            [RENDERING_VIEWER_W, RENDERING_VIEWER_H],
            [RENDERING_VIEWER_W, 0]
        ];
        this.sky_poly = {
            color : "#e6e6ff",
            vertices : poly,
        };

        // Water
        if(this.water_level > 0){
            let water_poly = [
                [this.terrain_x[0], 0],
                [this.terrain_x[0], this.water_level * VIEWPORT_H/SCALE],
                [this.terrain_x[this.terrain_x.length - 1], this.water_level * VIEWPORT_H/SCALE],
                [this.terrain_x[this.terrain_x.length - 1], 0]
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
                color: color,
                vertices: water_poly,
            };
            t.color1 = color;
            t.color2 = color;
            this.terrain.push(t);
        }

        // Ground, ceiling and creepers bodies
        for(let i = 0; i < this.terrain_x.length - 1; i++){

            // Ground
            poly = [
                [this.terrain_x[i], this.terrain_y[i]],
                [this.terrain_x[i + 1], this.terrain_y[i + 1]]
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
            t.color1 = color;
            t.color2 = color;
            this.terrain.push(t);

            // Visual poly to fill the ground
            poly.push([poly[1][0], 0]);
            poly.push([poly[0][0], 0]);
            color = "#66994D"; //[0.4, 0.6, 0.3];
            poly_data = {
                type : "ground",
                color : color,
                vertices : poly,
            }
            this.background_polys.push(poly_data);

            // Ceiling
            poly = [
                [this.terrain_x[i], this.terrain_y[i] + VIEWPORT_H/SCALE/2],
                [this.terrain_x[i + 1], this.terrain_y[i + 1] + VIEWPORT_H/SCALE/2]
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
            t.color1 = color;
            t.color2 = color;
            this.terrain.push(t);

            // Visual poly to fill the ceiling
            poly.push([poly[1][0], VIEWPORT_H/SCALE]);
            poly.push([poly[0][0], VIEWPORT_H/SCALE]);
            color = "#808080"; // [0.5, 0.5, 0.5];
            poly_data = {
                type : "ceiling",
                color : color,
                vertices : poly,
            }
            this.background_polys.push(poly_data);

            // Creepers
            if(this.creepers && this.creepers_width != null && this.creepers_height != null){
                if(space_from_precedent_creeper >= this.creepers_spacing){

                    let creeper_height = Math.random() * (this.creepers_height[1] - this.creepers_height[0]) + this.creepers_height[0];
                    let previous_creeper_part = t;

                    // cut the creeper in unit parts
                    for(let w = 0; w < Math.ceil(creeper_height / CREEPER_UNIT); w++){
                        let h;

                        // last iteration: rest of the creeper
                        if(w == Math.floor(creeper_height / CREEPER_UNIT)){
                            h = creeper_height % CREEPER_UNIT;
                        }
                        else{
                            h = CREEPER_UNIT;
                        }

                        /*poly = [
                            [this.terrain_x[i], this.terrain_y[i] + VIEWPORT_H/2 - (w * CREEPER_UNIT)],
                            [this.terrain_x[i] + this.creepers_width, this.terrain_y[i] + VIEWPORT_H/2 - (w * CREEPER_UNIT)],
                            [this.terrain_x[i] + this.creepers_width, this.terrain_y[i] + VIEWPORT_H/2 - (w * CREEPER_UNIT) - h],
                            [this.terrain_x[i], this.terrain_y[i] + VIEWPORT_H/2 - (w * CREEPER_UNIT) - h]
                        ];
                        this.fd_creeper.shape.Set([new b2.Vec2(poly[0][0], poly[0][1]),
                                new b2.Vec2(poly[1][0], poly[1][1]),
                                new b2.Vec2(poly[2][0], poly[2][1]),
                                new b2.Vec2(poly[3][0], poly[3][1])],
                            4);
                         */

                        this.fd_creeper.shape.SetAsBox(this.creepers_width/2, h/2);
                        body_def = new b2.BodyDef();
                        body_def.type = b2.Body.b2_dynamicBody;
                        body_def.position.Set(this.terrain_x[i] + this.creepers_width/2, this.terrain_y[i] + VIEWPORT_H/SCALE/2 - (w * CREEPER_UNIT) - h/2);
                        t = this.world.CreateBody(body_def);
                        t.CreateFixture(this.fd_creeper);
                        t.SetUserData(new CustomUserData("creeper", CustomUserDataObjectTypes.SENSOR_GRIP_TERRAIN)); // TODO: CustomUserData
                        color = "#6F8060"; // [0.437, 0.504, 0.375];
                        t.color1 = color;
                        t.color2 = color;
                        this.terrain.push(t);
                        poly_data = {
                            type : "creeper",
                            color : color,
                            body : t,
                        }
                        this.terrain_bodies.push(poly_data);

                        let rjd_def = new b2.RevoluteJointDef();
                        let anchor = new b2.Vec2(this.terrain_x[i] + this.creepers_width/2, this.terrain_y[i] + VIEWPORT_H/SCALE/2 - (w * CREEPER_UNIT));
                        rjd_def.Initialize(previous_creeper_part, t, anchor);
                        rjd_def.enableMotor = false;
                        rjd_def.enableLimit = true;
                        rjd_def.lowerAngle = 2 * Math.PI;
                        rjd_def.upperAngle = 2 * Math.PI;
                        let joint = this.world.CreateJoint(rjd_def);
                        joint.SetUserData(new CustomMotorUserData("creeper", 6, false));
                        this.creepers_joints.push(joint);
                        previous_creeper_part = t;
                    }
                    space_from_precedent_creeper = 0;
                }
                else{
                    space_from_precedent_creeper += this.terrain_x[i] - this.terrain_x[i - 1]
                }
            }
        }

        // Climbing surface
        if(!this.creepers){
            if(this.climbing_surface_size > 0){
                poly = [
                    [this.terrain_x[0], this.terrain_y[0] + VIEWPORT_H/SCALE/2],
                    [this.terrain_x[0], this.terrain_y[0] + VIEWPORT_H/SCALE/2 - this.climbing_surface_size],
                    [this.terrain_x[this.terrain_x.length - 1], this.terrain_y[this.terrain_y.length - 1] + VIEWPORT_H/SCALE/2 - this.climbing_surface_size],
                    [this.terrain_x[this.terrain_x.length - 1], this.terrain_y[this.terrain_y.length - 1] + VIEWPORT_H/SCALE/2]
                ];
                this.fd_creeper.shape.Set([new b2.Vec2(poly[0][0], poly[0][1]),
                                            new b2.Vec2(poly[1][0], poly[1][1]),
                                            new b2.Vec2(poly[2][0], poly[2][1]),
                                            new b2.Vec2(poly[3][0], poly[3][1])],
                                        4);
                let body_def = new b2.BodyDef();
                body_def.type = b2.Body.b2_staticBody;
                let t = this.world.CreateBody(body_def);
                t.CreateFixture(this.fd_creeper);
                t.SetUserData(new CustomUserData("creeper", CustomUserDataObjectTypes.SENSOR_GRIP_TERRAIN)); // TODO: CustomUserData
                let color = "#649C66"; // [0.391, 0.613, 0.398];
                t.color1 = color;
                t.color2 = color;
                this.terrain.push(t);
                poly_data = {
                    type : "creeper",
                    color : color,
                    body : t,
                }
                //this.terrain_bodies.push(poly_data);
            }
        }
    }

    // TODO
    _generate_clouds(){}

    _generate_agent(){
        let init_x = TERRAIN_STEP * this.TERRAIN_STARTPAD / 2;
        let init_y;
        // TODO: check if agent has the attribute old_morphology
        if(this.agent_body.old_morphology){
            init_y = TERRAIN_HEIGHT + 2 * this.agent_body.LEG_H;
        }
        else{
            init_y = TERRAIN_HEIGHT + this.agent_body.AGENT_CENTER_HEIGHT;
        }

        this.agent_body.draw(this.world, init_x, init_y, Math.random() * 2 * INITIAL_RANDOM - INITIAL_RANDOM);
    }

    _SET_RENDERING_VIEWPORT_SIZE(width, height=null, keep_ratio=true){
        RENDERING_VIEWER_W = width;
        if(keep_ratio || height != null){
            RENDERING_VIEWER_H = Math.floor(RENDERING_VIEWER_W / (VIEWPORT_W / VIEWPORT_H));
        }
        else{
            RENDERING_VIEWER_H = height;
        }
    }

    set_agent_position(position){
        this.agent_body.reference_head_object.m_xf.p.Assign(new b2.Vec2(position/100 * TERRAIN_LENGTH * TERRAIN_STEP/this.zoom, VIEWPORT_H/2));
    }

    set_scroll_offset(slider_value){
        this.scroll_offset = slider_value/100 * (TERRAIN_LENGTH * TERRAIN_STEP * SCALE * this.zoom - RENDERING_VIEWER_W * 0.9) - RENDERING_VIEWER_W * 0.05;
        this.render_change = true;
    }

    set_zoom(scale){
        this.zoom = scale;
        this.render_change = true;
    }

    //endregion
}