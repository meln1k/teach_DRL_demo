const bodyTypeMapping = new Map();
bodyTypeMapping.set("bipedal", "classic_bipedal");
bodyTypeMapping.set("chimpanzee", "climbing_profile_chimpanzee");


export default {
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
        if (status == 'init') {
            context.commit('startSimulation', {})
        }
        if (status == 'running') {
            context.commit('pauseSimulation', {});
        }
        if (status == 'paused') {
            context.commit('startSimulation', {});
        }
    },
    resetSimulation(context, payload) {
        context.commit('resetSimulation', payload);
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