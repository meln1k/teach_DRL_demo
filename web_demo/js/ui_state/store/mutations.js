export default {
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