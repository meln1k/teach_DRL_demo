export default {
    addModel(context, payload) {
        context.commit('addModel', payload);
    },
    clearModels(context, payload) {
        context.commit('clearModels', {});
    },
    addMorphology(context, payload) {
        context.commit('addMorphology', payload);
    },
    addItem(context, payload) {
        context.commit('addItem', payload);
    },
    clearItem(context, payload) {
        context.commit('clearItem', payload);
    }
};