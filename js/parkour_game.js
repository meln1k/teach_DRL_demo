class ParkourGame {
    constructor(morphologies, policies, positions, cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type) {

        this.draw_fps = 60;
        this.obs = [];
        this.nb_agents = 0;
        this.initWorld(morphologies, policies, positions, cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type);

        this.nb_steps = 0;
        this.running = false;
    }

    initWorld(morphologies, policies, positions, cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type) {

        if(window.multi_agents){
            this.env = new MAParametricContinuousParkour(
                morphologies,
                policies,
                positions,
                3,
                10,
                200,
                90,
                20,
                creepers_type);
        }
        else{
            this.env = new ParametricContinuousParkour(
                agent_body_type,
                3,
                10,
                200,
                25,
                20,
                creepers_type);
        }


        this.env.set_environment(cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type);

        // Flat Parkour
        /*this.env = new ParametricContinuousFlatParkour(0.5, this.config);
        this.env.set_environment(null,
            5,
            2.5 * SCALE * CREEPER_UNIT,
            30);*/

        this.obs.push(this.env.reset());

        //this.nb_actions = this.env.agent_body.get_action_size();
    }

    pause(){
        clearInterval(this.runtime);
        this.running = false;
        return "Resume";
    }

    async run(policy){
        if(this.running){
            return this.pause();
        }
        else {

            //console.log("loading policy", policy)

            if(multi_agents){
                for(let agent of window.game.env.agents){
                    agent.model = await tf.loadGraphModel(agent.policy.path + '/model.json');
                }
            }

            const model = await tf.loadGraphModel(policy + '/model.json');

            this.runtime = setInterval(() => {
                this.play(model);
            }, 1000 / this.draw_fps);
            this.running = true;
            return "Pause"
        }
    }

    reset(morphologies, policies, positions, cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type){
        clearInterval(this.runtime);
        this.running = false;
        this.initWorld(morphologies, policies, positions, cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type);
        this.env.render();
    }

    /**
     * Play one step
     */
    play(model) {

        if(window.multi_agents){
            for(let agent of window.game.env.agents){
                let state = this.obs[this.obs.length - 1][agent.id];

                let envState = tf.tensor(state,[1, state.length]);

                let inputs = {
                    "Placeholder_1:0": envState
                };

                let output = 'main/mul:0'

                agent.actions = agent.model.execute(inputs, output).arraySync()[0];
            }
            let step_rets = this.env.step();
            this.obs.push([...step_rets.map(e => e[0])]);
        }
        else{
            let state = this.obs[this.obs.length - 1];

            let envState = tf.tensor(state,[1, state.length]);

            let inputs = {
                "Placeholder_1:0": envState
            };

            let output = 'main/mul:0'

            let actions = model.execute(inputs, output).arraySync()[0];

            let ret = this.env.step(actions, 1);
            this.obs.push(ret[0]);
        }

        this.env.render();
        this.nb_steps += 1;
    }
}
