class ClimbingDynamics {
    constructor(){};

    before_step_climbing_dynamics(actions, body, world){
        for(let i = 0; i < body.sensors.length; i++){
            let action_to_check = actions[actions.length - i - 1];
            let sensor_to_check = body.sensors[body.sensors.length - i - 1];
            if(action_to_check > 0){ // Check whether the sensor should grasp or release
                sensor_to_check.GetUserData().ready_to_attach = true;
            }
            else {
                sensor_to_check.GetUserData().ready_to_attach = false;
                if(sensor_to_check.GetUserData().has_joint){ // if release and it had a joint => destroy it
                    sensor_to_check.GetUserData().has_joint = false;
                    let sensor_joints = [];
                    let joint = sensor_to_check.GetJointList();
                    while(joint != null){
                        sensor_joints.push(joint);
                        joint = joint.m_next;
                    }
                    const isRevolute = (s) => s.m_type == b2.Joint.e_revoluteJoint;
                    let idx_to_destroy = sensor_joints.findIndex(isRevolute);
                    if(idx_to_destroy != -1){
                        world.DestroyJoint(sensor_joints[idx_to_destroy]);
                    }
                }
            }
        }
    }

    after_step_climbing_dynamics(contact_detector, world){
        // Add climbing joints if needed
        for(let i = 0; i < contact_detector.contact_dictionaries.sensors.length; i++){
            let sensor = contact_detector.contact_dictionaries.sensors[i];
            if(contact_detector.contact_dictionaries.bodies[i].length > 0
                && sensor.GetUserData().ready_to_attach
                && sensor.GetUserData().has_joint){
                let other_body = contact_detector.contact_dictionaries.bodies[i][0];

                // Check if still overlapping after solver
                // Super coarse yet fast way, mainly useful for creepers
                let other_body_shape = other_body.GetFixtureList().GetShape();
                let x_values = [...other_body_shape.m_vertices.map(v => v.x)];
                let y_values = [...other_body_shape.m_vertices.map(v => v.y)];
                let radius = sensor.GetFixtureList().GetShape().m_radius + 0.01;

                if(sensor.GetWorldCenter().x + radius > Math.min(...x_values)
                    && sensor.GetWorldCenter().x - radius < Math.max(...x_values)
                    && sensor.GetWorldCenter().y + radius > Math.min(...y_values)
                    && sensor.GetWorldCenter().y - radius < Math.max(...y_values)){
                    let rjd = new b2.RevoluteJointDef();
                    rjd.Initialize(sensor, other_body, sensor.GetWorldCenter());

                    let joint = world.CreateJoint(rjd);
                    joint.GetBodyA().GetUserData().joint = joint;
                    sensor.GetUserData().has_joint = true;
                }
                else {
                    // Remove other_body from the list of bodies in contact with the sensor
                    let sensor_idx = contact_detector.contact_dictionaries.sensors.indexOf(sensor);
                    if(sensor_idx != -1){
                        let other_idx = contact_detector.contact_dictionaries.bodies[sensor_idx].indexOf(other_body);
                        contact_detector.contact_dictionaries.bodies[sensor_idx].splice(other_idx, 1);

                        if(contact_detector.contact_dictionaries.bodies[sensor_idx].length == 0){
                            sensor.GetUserData().has_contact = false;
                        }
                    }
                }
            }
        }
    }
}


function ClimbingContactDetector() {
    /*
     * Store contacts between sensors and graspable surfaces in a dictionaries associated to the sensor.
     */
    b2.ContactListener.call(this);
    this.contact_dictionaries = {
        sensors: [],
        bodies: []
    };
}

ClimbingContactDetector.prototype = Object.create(b2.ContactListener.prototype);
ClimbingContactDetector.prototype.constructor = ClimbingContactDetector;
ClimbingContactDetector.prototype.BeginContact = function (contact) {
    let bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
    for(let i = 0; i < bodies.length; i++){
        let body = bodies[i];
        if(body.GetUserData().object_type == CustomUserDataObjectTypes.BODY_SENSOR
        && body.GetUserData().check_contact){
            let other_body = bodies[(i + 1) % 2];
            if(other_body.GetUserData().object_type == CustomUserDataObjectTypes.GRIP_TERRAIN
            || other_body.GetUserData().object_type == CustomUserDataObjectTypes.SENSOR_GRIP_TERRAIN){
                body.GetUserData().has_contact = true;
                let idx = this.contact_dictionaries.sensors.indexOf(body);
                if(idx != -1){
                    this.contact_dictionaries.bodies[idx].push(other_body);
                }
                else{
                    this.contact_dictionaries.sensors.push(body);
                    this.contact_dictionaries.bodies.push([other_body]);
                }
            }
            else{
                return;
            }
        }
    }
};

ClimbingContactDetector.prototype.EndContact = function (contact){
    let bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
    for(let i = 0; i < bodies.length; i++) {
        let body = bodies[i];
        let other_body = bodies[(i + 1) % 2];
        if(body.GetUserData().object_type == CustomUserDataObjectTypes.BODY_SENSOR &&
            body.GetUserData().check_contact && body.GetUserData().has_contact){
            let body_idx = this.contact_dictionaries.sensors.indexOf(body);
            if (body_idx != -1) {
                let other_idx = this.contact_dictionaries.bodies[body_idx].indexOf(other_body);
                if(other_idx != -1){
                    this.contact_dictionaries.bodies[body_idx].splice(other_idx, 1);
                }

                if(this.contact_dictionaries.bodies[body_idx].length == 0){
                    body.GetUserData().has_contact = false;
                }
            }

        }
    }
};

ClimbingContactDetector.prototype.Reset = function(){
    this.contact_dictionaries = {
        body: []
    };
};