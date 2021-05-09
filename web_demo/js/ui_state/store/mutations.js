export default {
    followAgents(state, payload) {
        state.simulationState.followAgents = payload;
        window.follow_agent = payload;
        window.game.env.render();
        return state;
    },
    drawJoints(state, payload) {
        state.simulationState.drawJoints = payload;
        window.draw_joints = payload;
        window.game.env.render();
        return state;
    },
    drawLidars(state, payload) {
        state.simulationState.drawLidars = payload;
        return state;
    },
    drawSensors(state, payload) {
        state.simulationState.drawSensors = payload;
        return state;
    },
    drawNames(state, payload) {
        state.simulationState.drawNames = payload;
        return state;
    },
    startSimulation(state, payload) {
        state.simulationState.status = 'running';
        const policy = state.morphologies
            .filter(m => m.morphology == state.currentMorphology)
            .flatMap(morphology => morphology.seeds)
            .find(seed => seed.idx == state.currentSeedIdx).path;
        window.game.run(policy);
        return state;
    },
    pauseSimulation(state, payload) {
        window.game.pause();
        state.simulationState.status = 'paused';
        return state;
    },
    resetSimulation(state, payload) {
        state.simulationState.status = 'init';
        const morphologies = state.agents.map(a => a.morphology);
        const policies = state.agents.map(a => { 
            return {
                name: a.name, 
                path: a.path
            };
        });
        const positions = state.agents.map(a => null);

        window.game.reset(
            morphologies,
            policies,
            positions,
            // todo: do not use hard-coded vals here
            [0.0,0.0,0.0],
            parseFloat(0),
            parseFloat(0.3),
            parseFloat(3.0),
            parseFloat(1.0),
            parseFloat(20.0),
            getCreepersType());
        window.agent_selected = null;
        window.game.env.set_zoom(1);
        window.game.env.set_scroll(window.agent_selected, 0.0, parseFloat(0));
        window.game.env.render();
        return state;
    },
    addAgent(state, payload) {
        state.agents.push(payload);
        window.game.env.add_agent(payload.morphology, { name: payload.name, path: payload.path });
        window.game.env.render();
        return state;
    },
    deleteAgent(state, payload) {
        console.log("deleting agent", payload);
        state.agents.splice(payload.index, 1);
        window.game.env.delete_agent(payload.index);
        window.game.env.render();
        return state;
    },
    selectMorphology(state, payload) {
        state.currentMorphology = payload;
        state.currentSeedIdx = 0;
        return state;
    },
    selectSeedIdx(state, payload) {
        state.currentSeedIdx = payload;
        return state;
    },
    addMorphology(state, payload) {
        state.morphologies.push(payload);
        return state;
    }
};