export default {
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