const bodyTypeMapping = new Map();
bodyTypeMapping.set("bipedal", "classic_bipedal");
bodyTypeMapping.set("chimpanzee", "climbing_profile_chimpanzee");


export default {
    addAgent(context, payload) {
        console.log(context.state.morphologies)
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