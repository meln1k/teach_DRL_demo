class AbstractBody {

    constructor(scale, motors_torque){
        this.SCALE = scale;
        this.MOTORS_TORQUE = motors_torque;
        this.body_parts = [];
        this.motors = [];
        this.is_selected = false;
    }

    get_state_size(){
        return this.get_motors_state().length;
    }

    get_motors_state(){
        let state = [];
        for(let motor of this.motors){
            let motor_info = motor.GetUserData();
            if(motor_info.check_contact){
                let s = [
                    motor.GetJointAngle() + motor_info.angle_correction,
                    motor.GetJointSpeed() / motor_info.speed_control,
                    0.0
                ]
                if(motor_info.contact_body.GetUserData().has_contact){
                    s[2] = 1.0;
                }
                state = state.concat(s);
            }
            else{
                state = state.concat([
                    motor.GetJointAngle() + motor_info.angle_correction,
                    motor.GetJointSpeed() / motor_info.speed_control
                ])
            }
        }
        return state;
    }

    get_action_size(){
        return this.motors.length;
    }

    activate_motors(action){
        for(let i = 0; i < this.motors.length; i++){
            this.motors[i].SetMotorSpeed(this.motors[i].GetUserData().speed_control * Math.sign(action[i]));
            let clamp01 = Math.max(0, Math.min(Math.abs(action[i]), 1));
            this.motors[i].SetMaxMotorTorque(this.MOTORS_TORQUE * clamp01);
        }
    }

    draw(world, init_x, init_y, force_to_center){}

    get_elements_to_render(){
        return this.body_parts;
    }

    get_parts_position(){
        let positions = [];
        for(let body of this.body_parts){
            positions.push(body.GetPosition());
        }
        return positions;
    }

    // Check if the mouse position in the environment scale is inside the agent's morphology
    isMousePosInside(mousePos){
        for(let body of this.body_parts){
            let shape = body.GetFixtureList().GetShape();
            let vertices = [];
            for(let i = 0; i < shape.m_count; i++){
                let world_pos = body.GetWorldPoint(shape.m_vertices[i]);
                vertices.push({x: world_pos.x, y: world_pos.y});
            }

            // Count the number of intersections between the edges of the polygon and the line of equation y = mousePos.y which are to the right of mousePos.x
            let nb_intersections = 0;
            for(let i = 0; i < vertices.length; i++){
                let v1 = vertices[i];
                let v2;
                if(i == vertices.length - 1){
                    v2 = vertices[0];
                }
                else {
                    v2 = vertices[i+1];
                }

                // check if the edge between v1 and v2 cross the mouse y-coordinate
                if(mousePos.y >= Math.min(v1.y, v2.y) && mousePos.y <= Math.max(v1.y, v2.y)){
                    let intersection_x;

                    // compute the equation of the line between v1 and v2
                    let a = (v2.y - v1.y) / (v2.x - v1.x);
                    let b = v1.y - a * v1.x;

                    // compute the x-coordinate of the intersection point
                    if(Math.abs(a) == Infinity){
                        intersection_x = v1.x;
                    }
                    else{
                        intersection_x = (mousePos.y - b) / a;
                    }

                    // increase the number of intersection only if the intersection point is to the rigth of the mouse x-coordinate
                    if(intersection_x >= mousePos.x) {
                        nb_intersections += 1;
                    }
                }
            }

            // the mousePos is inside the agent's body if there is an odd number of intersections, else it is outside
            if(nb_intersections % 2 != 0){
                return true;
            }
        }
        return false;
    }

    set_awake(bool){
        for(let body of this.body_parts){
            body.SetAwake(bool);
        }
    }

    destroy(world){
        for(let body of this.body_parts){
            world.DestroyBody(body);
        }
        this.body_parts = [];
        this.motors = [];
    }
}