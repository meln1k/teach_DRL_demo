export default {
    morphologies: [],
    currentMorphology: "bipedal",
    currentSeedIdx: "1",
    agents: [],
    mode: 'procedural_generation', // 'drawing'
    simulationState: {
        status: 'init', // 'running', 'paused'
        agentFollowed: null,
        drawJoints: false,
        drawLidars: true,
        drawSensors: false,
        drawNames: false
    },
    parkourConfig: {
        dim1: 0,
        dim2: 0,
        dim3: 0,
        smoothing: 20,
        waterLevel: 0
    },
    creepersConfig: {
        width: 0.3,
        height: 3,
        spacing: 1,
        type: 'Swingable' // 'Rigid'
    },
    drawingModeState: {
        drawing: false,
        drawing_ground: false,
        drawing_ceiling: false,
        erasing: false,
    }
};