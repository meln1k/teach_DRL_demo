// import * as tf from '@tensorflow/tfjs';


class ParkourHeadlessGame {
    constructor(config, cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type) {
        this.config = config
        this.obs = [];
        this.initWorld(cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type);
    }

    initWorld(cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type) {

        let agent_body_type = "old_classic_bipedal";
        let lidars_type = "down";
        //let agent_body_type = "climbing_profile_chimpanzee";
        //let lidars_type = "up";
        this.env = new ParametricContinuousParkour(agent_body_type,
                                                    3,
                                                    10,
                                                    200,
                                                    25,
                                                    lidars_type,
                                                    20,
                                                    creepers_type);

        this.env.set_environment(cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type);

        // Flat Parkour
        /*this.env = new ParametricContinuousFlatParkour(0.5, this.config);
        this.env.set_environment(null,
            5,
            2.5 * SCALE * CREEPER_UNIT,
            30);*/

        this.obs.push(this.env.reset());

        this.nb_actions = this.env.agent_body.motors.length;
        //this.stateSize = this.env.bodies.length * 10 + this.env.joints.length * 3
    }

}

class ParkourGame extends ParkourHeadlessGame {
    constructor(config, canvas_id, cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type) {
        config.canvas_id = canvas_id;
        super(config, cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type);
        this.nb_steps = 0;
        this.done = false;
        this.running = false;
    }


    async run(policy){
        if(this.running){
            clearInterval(this.runtime);
            this.running = false;
            return "Resume";
        } else {

            console.log("loading policy", policy)
            
            const model = await tf.loadGraphModel(`./models/${policy}/model.json`);

            this.runtime = setInterval(() => {
                this.play(model);
            }, 1000 / this.config.draw_fps);
            this.running = true;
            return "Pause"
        }
    }

    reset(cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type){
        clearInterval(this.runtime);
        this.running = false;
        this.initWorld(cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type);
        this.env.render();
    }

    /**
     * Play one step
     */
    play(model) {

        let state = this.obs[this.obs.length - 1];

        let envState = tf.tensor(state,[1, state.length]);

        let inputs = {
            "Placeholder_1:0": envState
        };

        let output = 'main/mul:0'

        let actions = model.execute(inputs, output).arraySync()[0];


        let ret = this.env.step(actions, 1);
        this.obs.push(ret[0]);
        this.env.render();
        this.nb_steps += 1;
    }
}
