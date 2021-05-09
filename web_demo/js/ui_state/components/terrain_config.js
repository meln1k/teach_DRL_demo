import Component from '../lib/component.js';
import store from '../store/index.js';
export default class TerrainConfig extends Component {
    constructor() {
        super({
            store,
            element: document.querySelector('#terrainShapeCol')
        });
    }
    render() {
        const parkourConfig = store.state.parkourConfig;

        document.querySelector("#dim1Slider").value = parkourConfig.dim1;
        document.querySelector("#dim2Slider").value = parkourConfig.dim2;
        document.querySelector("#dim3Slider").value = parkourConfig.dim3;
        document.querySelector("#smoothingSlider").value = parkourConfig.smoothing;
        document.querySelector("#waterSlider").value = parkourConfig.waterLevel;


        document.querySelector("#dim1Value").innerText = parkourConfig.dim1;
        document.querySelector("#dim2Value").innerText = parkourConfig.dim2;
        document.querySelector("#dim3Value").innerText = parkourConfig.dim3;
        document.querySelector("#smoothingValue").innerText = parkourConfig.smoothing;
        document.querySelector("#waterValue").innerText = parkourConfig.waterLevel;

    }
};