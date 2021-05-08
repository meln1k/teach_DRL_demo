export default {
    addModel(state, payload) {
        state.models.push(payload)
        return state;
    },
    clearModels(state, payload) {
        state.models = [];
        return state;
    },
    addMorphology(state, payload) {
        state.morphologies.push(payload);
        return state;
    },
    addItem(state, payload) {
        state.items.push(payload);
        return state;
    },
    clearItem(state, payload) {
        state.items.splice(payload.index, 1);
        return state;
    }
};