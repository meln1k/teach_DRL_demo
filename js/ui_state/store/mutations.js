export default {
    updateCreepersConfig(state, payload) {
        console.log(payload);
        switch (payload.name) {
            case 'width':
                state.creepersConfig.width = payload.value;
                break;
            case 'height':
                state.creepersConfig.height = payload.value;
                break;
            case 'spacing':
                state.creepersConfig.spacing = payload.value;
                break;
            case 'type':
                state.creepersConfig.type = payload.value;
                break;
        }
        return state;
    },
    updateCppnConfig(state, payload) {
        switch (payload.name) {
            case 'dim1':
                state.parkourConfig.dim1 = payload.value;
                break;
            case 'dim2':
                state.parkourConfig.dim2 = payload.value;
                break;
            case 'dim3':
                state.parkourConfig.dim3 = payload.value;
                break;
            case 'smoothingSlider':
                state.parkourConfig.smoothing = payload.value;
                break;
            case 'waterSlider':
                state.parkourConfig.waterLevel = payload.value;
                break;
        }
        return state;
    },
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
        window.draw_lidars = payload;
        window.game.env.render();
        return state;
    },
    drawSensors(state, payload) {
        state.simulationState.drawSensors = payload;
        window.draw_sensors = payload;
        window.game.env.render();
        return state;
    },
    drawNames(state, payload) {
        state.simulationState.drawNames = payload;
        window.draw_names = payload;
        window.game.env.render();
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
        let positions;
        if (payload.keepPositions) {
            positions = [...window.game.env.agents.map(agent => agent.agent_body.reference_head_object.GetPosition())];
        } else {
            positions = state.agents.map(a => null);
        }

        const parkourConfig = state.parkourConfig;
        const creepersConfig = state.creepersConfig;

        window.game.reset(
            morphologies,
            policies,
            positions,
            [parkourConfig.dim1,parkourConfig.dim2,parkourConfig.dim3],
            parkourConfig.waterLevel,
            creepersConfig.width,
            creepersConfig.height,
            creepersConfig.spacing,
            parkourConfig.smoothing,
            creepersConfig.type == "Swingable");
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