const bodyTypeMapping = new Map();
bodyTypeMapping.set("bipedal", "classic_bipedal");
bodyTypeMapping.set("chimpanzee", "climbing_profile_chimpanzee");


export default {
    changeCreepersConfig(context, payload) {
        context.commit('updateCreepersConfig', payload);
        context.commit('resetSimulation', { keepPositions: true});
    },
    changeCppnCongfig(context, payload) {
        context.commit('updateCppnConfig', payload);
        context.commit('resetSimulation', { keepPositions: true});
    },
    toggleSwitch(context, payload) {
        switch (payload.name) {
            case 'followAgents':
                context.commit('followAgents', payload.value);
                break;
            case 'drawJoints':
                context.commit('drawJoints', payload.value);
                break;
            case 'drawLidars':
                context.commit('drawLidars', payload.value);
                break;
            case 'drawSensors':
                context.commit('drawSensors', payload.value);
                break;
            case 'drawNames':
                context.commit('drawNames', payload.value);
                break;
        }
    },
    toggleRun(context, payload) {
        const status = context.state.simulationState.status;
        switch (status) {
            case 'init':
                context.commit('startSimulation', {});
                // read the draw switches state;
                context.commit('followAgents', context.state.simulationState.followAgents);
                context.commit('drawJoints', context.state.simulationState.drawJoints);
                context.commit('drawLidars', context.state.simulationState.drawLidars);
                context.commit('drawSensors', context.state.simulationState.drawSensors);
                context.commit('drawNames', context.state.simulationState.drawNames);
                break;
            case 'running':
                context.commit('pauseSimulation', {});
                break;
            case 'paused':
                context.commit('startSimulation', {});
                break;
        }
    },
    resetSimulation(context, payload) {
        context.commit('resetSimulation', {keepPositions: false});
    },
    addAgent(context, payload) {
        if (context.state.simulationState.status == 'running') {
            context.commit('pauseSimulation', {});
        }

        const morphology = body_type_mapping.get(context.state.currentMorphology);
        const currentSeed = context.state.morphologies
            .filter(m => m.morphology == context.state.currentMorphology)
            .flatMap(morphology => morphology.seeds)
            .find(seed => seed.idx == context.state.currentSeedIdx);
        const name = context.state.currentMorphology + "_" + currentSeed.seed;
        const path = currentSeed.path;
        context.commit('addAgent', {
            morphology: morphology,
            name: name,
            path: path,
        });
    },
    deleteAgent(context, payload) {
        context.commit('deleteAgent', payload);
    },
    selectMorphology(context, payload) {
        context.commit('selectMorphology', payload);
    },
    selectSeedIdx(context, payload) {
        context.commit('selectSeedIdx', payload);
    },
    addMorphology(context, payload) {
        context.commit('addMorphology', payload);
    }
};