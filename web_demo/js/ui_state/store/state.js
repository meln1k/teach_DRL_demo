export default {
    morphologies: [],
    currentMorphology: "bipedal",
    currentSeedIdx: "1",
    agents: [],
    simulationState: {
        status: 'init', // 'running', 'paused'
        followAgent: true,
        drawJoints: false,
        drawLidars: true,
        drawSensors: false,
        drawNames: false
    }
};