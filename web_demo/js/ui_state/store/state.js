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
    }
};