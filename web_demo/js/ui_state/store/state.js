export default {
    morphologies: [],
    currentMorphology: "bipedal",
    currentSeedIdx: "1",
    agents: [],
    simulationState: {
        status: 'init', // 'running', 'paused'
        followAgents: true,
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
        type: 'Rigid'
    }
};