export default {
    addAgent(state, payload) {
        state.agents.push(payload);
        window.game.env.add_agent(payload.morphology, {name: payload.name, path: payload.path});
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