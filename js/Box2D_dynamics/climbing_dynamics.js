function ClimbingContactDetector() {
    b2.ContactListener.call(this);
    this.contact_dictionaries = {
        body: []
    };
}

ClimbingContactDetector.prototype = Object.create(b2.ContactListener.prototype);
ClimbingContactDetector.prototype.constructor = ClimbingContactDetector;
ClimbingContactDetector.prototype.BeginContact = function (contact) {
    let bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
    for(let i = 0; i < bodies.length; i++){
        let body = bodies[i];
        if(body.GetUserData().object_type == CustomUserDataObjectTypes.BODY_SENSOR
        && bodyGetUserData().check_contact){
            let other_body = bodies[(i + 1) % 2];
            if(other_body.GetUserData().object_type == CustomUserDataObjectTypes.GRIP_TERRAIN
            || other_body.GetUserData().object_type == CustomUserDataObjectTypes.SENSOR_GRIP_TERRAIN){
                body.GetUserData().has_contact = true;
                if(this.contact_dictionaries.body.includes(body)){
                    this.contact_dictionaries.body.push(other_body);
                }
                else{
                    this.contact_dictionaries.body = [other_body];
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
            let index = this.contact_dictionaries.body.indexOf(other_body);
            if (index !== -1) {
                this.contact_dictionaries.body.splice(index, 1);
            }
            if(this.contact_dictionaries.body.length == 0){
                body.GetUserData().has_contact = false;
            }
        }
    }
};

ClimbingContactDetector.prototype.Reset = function(){
    this.contact_dictionaries = {
        body: []
    };
};