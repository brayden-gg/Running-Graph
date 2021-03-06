class MenuElement {
    constructor(options) {
        this.queryParamName = options.queryParamName;
        this.title = options.title;
        this.containerID = options.containerID ?? options.queryParamName + "Container";
    }

    createElement() {
        let containerElt = document.createElement("div");

        containerElt.id = this.containerID;

        containerElt.style.float = "left";
        containerElt.style.margin = "0px";

        let titleElt = document.createElement("p");
        titleElt.innerHTML = "&emsp;" + this.title + ": &nbsp";
        titleElt.style.float = "left";
        titleElt.style.margin = "0px";

        containerElt.appendChild(titleElt);
        this.container = containerElt;
        return containerElt;
    }
}

class DropdownMenuElement extends MenuElement {
    constructor(options) {
        super(options);
        this.optionNames = options.optionNames;
        this.optionValues = options.optionValues ?? this.optionNames;

        console.log(this.optionNames, this.optionValues);

        let query = new URLSearchParams(window.location.search);
        this.value = query.get(this.queryParamName) ?? options.defaultValue ?? this.optionValues[0];
    }

    createElement() {
        let containerElt = super.createElement();

        let selectElt = document.createElement("select");
        selectElt.id = this.queryParamName;
        selectElt.name = this.queryParamName;
        selectElt.setAttribute("onchange", "this.form.submit()");
        selectElt.style.float = "left";
        selectElt.style.margin = "0px";
        for (let i = 0; i < this.optionNames.length; i++) {
            let option = document.createElement("option");
            option.innerHTML = this.optionNames[i];
            option.value = this.optionValues[i];
            selectElt.appendChild(option);
        }
        selectElt.value = this.value;

        this.select = selectElt;

        containerElt.appendChild(selectElt);

        return containerElt;
    }
}

class InputMenuElement extends MenuElement {
    constructor(options) {
        super(options);

        let query = new URLSearchParams(window.location.search);
        this.value = query.get(this.queryParamName) || options.defaultValue;
    }

    createElement() {
        let containerElt = super.createElement();

        let inputElt = document.createElement("input");
        inputElt.id = this.queryParamName;
        inputElt.name = this.queryParamName;
        inputElt.type = "text";
        inputElt.setAttribute("onchange", "this.form.submit()");
        inputElt.style.float = "left";
        inputElt.style.margin = "0px";
        if (this.value != "a^" && this.value != ".") {
            inputElt.value = this.value;
        }

        containerElt.appendChild(inputElt);

        this.input = inputElt;
        return containerElt;
    }
}

class CheckboxMenuElement extends MenuElement {
    constructor(options) {
        super(options);
        let query = new URLSearchParams(window.location.search);
        this.value = query.get(this.queryParamName) ?? options.defaultValue ?? "off";
    }

    createElement() {
        let containerElt = super.createElement();

        let inputElt = document.createElement("input");
        inputElt.id = this.queryParamName;
        inputElt.name = this.queryParamName;
        inputElt.type = "checkbox";
        inputElt.setAttribute("onchange", "this.form.submit()");
        inputElt.style.float = "left";
        inputElt.style.margin = "0px";
        inputElt.style.marginTop = "5px";
        inputElt.checked = this.value == "on";
        containerElt.appendChild(inputElt);

        this.input = inputElt;
        return containerElt;
    }
}
