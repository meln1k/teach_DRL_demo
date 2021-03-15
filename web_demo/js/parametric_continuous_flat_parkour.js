//region Constants

const FPS = 50
const SCALE  = 30 // affects how fast-paced the game is, forces should be adjusted as well
const VIEWPORT_W = 1300
const VIEWPORT_H = 350

let RENDERING_VIEWER_W = VIEWPORT_W
let RENDERING_VIEWER_H = VIEWPORT_H

const NB_LIDAR = 10
const LIDAR_RANGE   = 160/SCALE

const INITIAL_RANDOM = 5

const TERRAIN_STEP   = 14/SCALE
const TERRAIN_LENGTH = 200     // in steps
const TERRAIN_HEIGHT = VIEWPORT_H/SCALE/4
const TERRAIN_GRASS    = 10    // low long are grass spots, in steps
const INITIAL_TERRAIN_STARTPAD = 20 // in steps
const FRICTION = 2.5

const WATER_DENSITY = 4.0
const NB_FIRST_STEPS_HANG = 5
const CREEPER_UNIT = 10/SCALE;

//endregion

class ParametricContinuousFlatParkour {
    // TODO: metadata ?

    constructor(water_level, config/*, agent_body_type*/){
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

        // TODO
        // Create Walker
        //this.agent_body = new OldClassicBipedalBody(SCALE);
        this.agent_body = new ClassicBipedalBody(SCALE);

        if(this.agent_body.AGENT_WIDTH / TERRAIN_STEP + 5 <= INITIAL_TERRAIN_STARTPAD){
            this.TERRAIN_STARTPAD = INITIAL_TERRAIN_STARTPAD;
        }
        else{
            this.TERRAIN_STARTPAD = this.agent_body.AGENT_WIDTH / TERRAIN_STEP + 5;
        }

        this.create_terrain_fixtures();

        this.set_environment(null,
            5,
            5.5 * SCALE * CREEPER_UNIT,
            20);
        this.reset();

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
            this.creepers_height = [creepers_height/SCALE, 2 * CREEPER_UNIT];
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
        //this.agent_body.destroy(this.world);
    }

    reset(){
        this._destroy();
        this.world.contactListener_bug_workaround = new ContactDetector(this);
        this.world.SetContactListener(this.world.contactListener_bug_workaround);
        this.critical_contact = false;
        this.prev_shaping = null;
        this.scroll_offset = - 0.05 * VIEWPORT_W;
        this.lidar_render = 0;

        this.generate_game();

        // Set info / action spaces
        let agent_action_size = this.agent_body.get_action_size();
        //this.action_space =

        let agent_state_size = this.agent_body.get_state_size();
        // let high = // TODO
        // this.observation_space = // TODO

        this.lidar = [];
        /*for(let i = 0; i < NB_LIDAR; i++){
            this.lidar.push(new LidarCallback(this.agent_body.reference_head_object.GetFixtureList().GetFilterData().maskBits));
        }*/

        // TODO
        let actions_to_play = Array.from({length: this.agent_body.motors.length}, () => Math.random() * 2 - 1);
        /*if(this.agent_bod.body_type == BodyTypesEnum.CLIMBER){
            // Init climber
            let y_diff = 0;
            for(let i = 0; i < this.agent_body.sensors.length; i++){
               //...
            }
        }*/

        return this.step(actions_to_play)[0];
    }

    step(action){

        //this.agent_body.reference_head_object.ApplyForce(new b2.Vec2(100000, 0), this.agent_body.reference_head_object.GetPosition().Clone().Add(new b2.Vec2(-1, 0)), true);

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
        //console.log(pos);
        let vel = head.GetLinearVelocity();

        // TODO: LIDARS, STATE, REWARD

        let state = [];
        let reward = 0;
        let done = false;

        return state, reward, done, {"success": false}
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
            this.terrain_y.push(TERRAIN_HEIGHT + (Math.random() * 20 - 10)/SCALE);
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
            [0, VIEWPORT_H],
            [VIEWPORT_W, VIEWPORT_H],
            [VIEWPORT_W, 0]
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
            t.SetUserData(new CustomUserData("water", CustomUserDataObjectTypes.WATER)); // TODO: CustomUserData
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
            let color;
            if (i % 2 == 0){
                color = "#4dff4d"; // [0.3, 1.0, 0.3];
            }
            else{
                color = "#4dcc4d"; //[0.3, 0.8, 0.3];
            }
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
                this.terrain_bodies.push(poly_data);
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
        this.scroll_offset = slider_value/100 * (TERRAIN_LENGTH * TERRAIN_STEP * SCALE * this.zoom - VIEWPORT_W * 0.9) - VIEWPORT_W * 0.05;
        this.render_change = true;
    }

    set_zoom(scale){
        this.zoom = scale;
        this.render_change = true;
    }

    //endregion
}