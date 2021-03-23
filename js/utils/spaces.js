class Box{
    constructor(low, high, shape=null){
        this.shape = shape;
        this.low = low;
        this.high = high;
        this.bounded_below = (-Infinity < this.low);
        this.bounded_above = (Infinity > this.high);
    }

    sample(){
        /*
        Generates a single random sample inside of the Box.
        In creating a sample of the box, each coordinate is sampled according to
        the form of the interval:
        * [a, b] : uniform distribution
        * [a, oo) : shifted exponential distribution
        * (-oo, b] : shifted negative exponential distribution
        * (-oo, oo) : normal distribution
        */

        let high = this.high;
        let sample = [];


    }
}