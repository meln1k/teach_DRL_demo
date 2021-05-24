import Component from '../lib/component.js';
import store from '../store/index.js';

export default class DrawingMode extends Component {
    constructor() {
        super({
            store,
            element: document.querySelector('#drawingMode')
        });
    }
    render() {
        this.element.querySelector('#drawingModeSwitch').checked = store.state.mode == 'drawing';

        const state = store.state.drawingModeState;
        let drawGroundButton = this.element.querySelector('#drawGroundButton');
        let drawCeilingButton = this.element.querySelector('#drawCeilingButton');
        let eraseButton = this.element.querySelector('#eraseButton');
        let clearButton = this.element.querySelector('#clearButton');
        let generateTerrainButton = this.element.querySelector('#generateTerrainButton');

        if(store.state.mode == 'procedural_generation'){

            drawGroundButton.className = "btn btn-outline-success disabled";
            drawCeilingButton.className = "btn btn-outline-secondary disabled";
            eraseButton.className = "btn btn-outline-warning disabled";
            clearButton.className = "btn btn-danger disabled";
            generateTerrainButton.className = "btn btn-success disabled";
            generateTerrainButton.innerText = "Generate terrain";
        }
        else if(store.state.mode == 'drawing'){

            clearButton.className = "btn btn-danger";

            if(state.drawing){

                drawGroundButton.className = "btn btn-outline-success";
                drawCeilingButton.className = "btn btn-outline-secondary";
                eraseButton.className = "btn btn-outline-warning";

                if(state.drawing_ground){
                    drawGroundButton.className = "btn btn-success";
                }
                else if(state.drawing_ceiling){
                    drawCeilingButton.className = "btn btn-secondary";
                }
                else if(state.erasing){
                    eraseButton.className = "btn btn-warning";
                }
                generateTerrainButton.className = "btn btn-success";
                generateTerrainButton.innerText = "Generate terrain";
            }
            else{
                drawGroundButton.className = "btn btn-outline-success disabled";
                drawCeilingButton.className = "btn btn-outline-secondary disabled";
                eraseButton.className = "btn btn-outline-warning disabled";
                generateTerrainButton.className = "btn btn-primary";
                generateTerrainButton.innerText = "Return to draw";
            }
        }
    }
};