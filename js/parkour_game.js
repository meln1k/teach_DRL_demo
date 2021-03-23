
class ParkourHeadlessGame {
    constructor(config) {
        this.config = config
        this.initWorld()
    }

    initWorld() {

        this.env = new ParametricContinuousFlatParkour(0.25, this.config);

        this.nb_actions = this.env.agent_body.motors.length;
        //this.stateSize = this.env.bodies.length * 10 + this.env.joints.length * 3
    }

}



class ParkourGame extends ParkourHeadlessGame {
    constructor(config, canvas_id) {
        config.canvas_id = canvas_id
        super(config)
    }

    loop() {
        setInterval(() => {
            this.play();
        }, 1000 / this.config.draw_fps)
    }

    /**
     * Play one step
     */
    play() {

        let actions = Array.from({length: this.nb_actions}, () => Math.random() * 2 - 1);
        this.env.step(actions, 1);
        this.env.render();
        //}
    }


    loadBrain(folder, name, callback) {
        this.agent.restore(folder, name, callback)
        // var title = name.replace('model-ddpg-walker-', '').replace('/model', '').replace('model-ddpg-walker', '')
        // document.getElementById('brain-name').innerText = title

    }
}
