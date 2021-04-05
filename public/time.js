class Time {
    constructor(t) {
        if (arguments.length == 1) {
            this.value = Time.parse(t);
        } else {
            let len = Math.min(arguments.length, 3);
            this.value = 0;
            for (let i = 0; i < len; i++) {
                this.value += arguments[len - i - 1] * 60 ** i;
            }
        }
    }
    static parse(t) {
        if (t instanceof Time) {
            return t.value;
        } else if (typeof t == 'string') {
            let splitTime = t.split(':');
            if (splitTime.length > 3) {
                return NaN;
            }
            let secs = 0;
            for (let i = 0; i < splitTime.length; i++) {
                secs += splitTime[splitTime.length - i - 1] * 60 ** i;
            }
            return secs;
        } else if (typeof t == 'number') {
            return t;
        } else {
            return NaN;
        }
    }

    toString(precision) {
        let h = this.getHours();
        let m = this.getMinutes();
        let s = this.getSeconds();

        return (h ? h + ':' : '') + (h ? m.toString().padStart(2, 0) : m) + ':' + s.toFixed(precision).padStart(2 + (precision ? precision + 1 : 0), 0);
    }

    static stringify(t, precision) {
        return new Time(t).toString(precision);
    }

    valueOf() {
        return this.value;
    }

    getHours() {
        return Math.floor(this.value / 3600);
    }

    getMinutes() {
        return Math.floor(this.value / 60) % 60;
    }

    getSeconds() {
        return Math.min(this.value % 60, 59);
    }

    setHours(t) {
        this.value -= this.getHours() * 3600;
        this.value += Time.parse(t) * 3600;
        return this;
    }

    setMinutes(t) {
        this.value -= this.getMinutes() * 60;
        this.value += Time.parse(t) * 60;
        return this;
    }

    setSeconds(t) {
        this.value -= this.getSeconds();
        this.value += Time.parse(t);
        return this;
    }

    static add(a, b) {
        return new Time(Time.parse(a) + Time.parse(b))
    }

    add(other) {
        this.value += Time.parse(other);
        return this;
    }

    static sub(a, b) {
        return new Time(Time.parse(a) - Time.parse(b))
    }

    sub(other) {
        this.value -= Time.parse(other);
        return this;
    }
}