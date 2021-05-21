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
            positions = [...window.game.env.agents.map(agent => agent.init_pos)];
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
            creepersConfig.type == "Swingable",
            window.ground,
            window.ceiling);
        window.agent_selected = null;
        window.game.env.set_zoom(window.zoom);
        window.game.env.set_scroll(window.agent_selected, window.scroll[0], window.scroll[1]);
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
    followAgent(state, payload) {
        if(payload.value){
            window.follow_agent = payload.value;
            window.agent_selected = window.game.env.agents[payload.index];
            state.simulationState.agentFollowed = window.agent_selected;
        }
        else {
            window.follow_agent = false;
            window.agent_selected = null;
            state.simulationState.agentFollowed = null;
        }
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
    },
    switchMode(state, payload) {
        if(payload){
            state.drawingModeState.drawing = true;
            state.mode = 'drawing';
            background("#E6F0FF");
            drawing_canvas.clear();
            window.ground = [];
            window.ceiling = [];
            window.terrain = {
                ground: [],
                ceiling: []
            };
        }
        else{
            state.mode = 'procedural_generation';
            state.drawingModeState.drawing = false;
            state.drawingModeState.drawing_ground = false;
            state.drawingModeState.drawing_ceiling = false;
            state.drawingModeState.erasing = false;
        }
        state.simulationState.status = 'init';
        state.agents = [];
        window.game.env.set_zoom(0.35);
        window.game.env.set_scroll(null, -0.05 * RENDERING_VIEWER_W, 0);
        window.init_default();
        return state;
    },
    drawGround(state, payload){
        state.drawingModeState.drawing_ground = payload;
        state.drawingModeState.drawing_ceiling = false;
        state.drawingModeState.erasing = false;
        return state;
    },
    drawCeiling(state, payload){
        state.drawingModeState.drawing_ground = false;
        state.drawingModeState.drawing_ceiling = payload;
        state.drawingModeState.erasing = false;
        return state;
    },
    erase(state, payload){
        state.drawingModeState.drawing_ground = false;
        state.drawingModeState.drawing_ceiling = false;
        state.drawingModeState.erasing = payload;
        return state;
    },
    clear(state, payload){
        state.drawingModeState.drawing = true;
        background("#E6F0FF");
        drawing_canvas.clear();
        window.ground = [];
        window.ceiling = [];
        window.terrain = {
            ground: [],
            ceiling: []
        };
        state.simulationState.status = 'init';
        state.agents = [];
        window.game.env.set_zoom(0.35);
        window.game.env.set_scroll(null, -0.05 * RENDERING_VIEWER_W, 0);
        window.init_default();
        return state;
    },
    generateTerrain(state, payload){
        state.drawingModeState.drawing = payload;

        window.game.env.set_zoom(0.35);
        window.game.env.set_scroll(null, -0.05 * RENDERING_VIEWER_W, 0);

        // Generate the terrain from the shapes drawn
        if(!state.drawingModeState.drawing) {

            state.drawingModeState.drawing_ground = false;
            state.drawingModeState.drawing_ceiling = false;
            state.drawingModeState.erasing = false;

            // Sort drawing values for ground and ceiling
            window.terrain.ground.sort(function (a, b) {
                return a.x - b.x;
            });
            for (let p of window.terrain.ground) {
                window.ground.push({
                    x: p.x / (window.game.env.scale * window.game.env.zoom),
                    y: (RENDERING_VIEWER_H - p.y) / (window.game.env.scale * window.game.env.zoom)
                })
            }

            window.terrain.ceiling.sort(function (a, b) {
                return a.x - b.x;
            });
            for (let p of window.terrain.ceiling) {
                window.ceiling.push({
                    x: p.x / (window.game.env.scale * window.game.env.zoom),
                    y: (RENDERING_VIEWER_H - p.y) / (window.game.env.scale * window.game.env.zoom)
                })
            }

            state.simulationState.status = 'init';
            state.agents = [];
            window.init_default();
        }

        // Return to drawing
        else {
            window.ground = [];
            window.ceiling = [];
            state.simulationState.status = 'init';
            state.agents = [];
            window.init_default();
            image(drawing_canvas, 0, 0);
        }
        return state;
    }
};