class MenuElement {
    constructor(options) {
        this.queryParamName = options.queryParamName;
        this.title = options.title;
        this.containerID = options.containerID;
    }

    createElement() {
        let containerElt = document.createElement("div");
        if (this.containerID) {
            containerElt.id = this.containerID;
        }
        containerElt.style.float = "left";
        containerElt.style.margin = "0px";

        let titleElt = document.createElement("p");
        titleElt.innerText = "&emsp;" + this.title + ": &nbsp";
        titleElt.style.float = "left";
        titleElt.style.margin = "0px";

        containerElt.appendChild(titleElt);
        this.container = containerElt;
        return containerElt;
    }
}


class DropdownMenuElement extends MenuElement{
    constructor(options) {
        super(options)
        this.optionNames = options.optionNames;
        this.optionValues = options.optionValues;

        let query = new URLSearchParams(window.location.search);
        this.value = query.get(this.queryParamName) ?? options.value ?? options.optionValues[0];
    }

    createElement() {
        let containerElt = super.createElement();

        let selectElt = document.createElement("select");
        selectElt.id = this.queryParamName;
        selectElt.name = this.queryParamName;
        selectElt.onchange = "this.form.submit()";
        selectElt.style.float = "left";
        selectElt.style.margin = "0px";
        for (let i = 0; i < this.optionNames.length){;
            let option = document.createElement("option");
            option.innerText = this.optionNames[i];
            option.value = this.optionValues[i];
            selectElt.appendChild(option);
        }
        selectElt.value = this.value;

        this.select = selectElt;

        containerElt.appendChild(selectElt);

        return containerElt;
    }
}

class InputMenuElement extends MenuElement{
    constructor(options) {
        super(options);

        let query = new URLSearchParams(window.location.search);
        this.value = query.get(this.queryParamName) ?? options.value ?? "";
    }

    createElement() {
        let containerElt = super.createElement();

        let inputElt = document.createElement("input");
        inputElt.id = this.queryParamName;
        inputElt.name = this.queryParamName;
        inputElt.type="text";
        inputElt.onchange = "this.form.submit()";
        inputElt.style.float = "left";
        inputElt.style.margin = "10px";
        inputElt.value = this.value;
        containerElt.appendChild(selectElt);

        this.input = inputElt;
        return containerElt;
    }
}

class CheckboxMenuElement extends MenuElement{
    constructor(options) {
        super(options)
        let query = new URLSearchParams(window.location.search);
        this.value = query.get(this.queryParamName) ?? options.value ?? "off";
    }

    createElement() {

        
        let containerElt = super.createElement();

        let inputElt = document.createElement("input");
        inputElt.id = this.queryParamName;
        inputElt.name = this.queryParamName;
        inputElt.type="checkbox"
        inputElt.onchange = "this.form.submit()"
        inputElt.style.float = "left"
        inputElt.style.margin = "0px"
        inputElt.style.marginTop = "5px"
        inputElt.checked = this.value == "on"
        containerElt.appendChild(selectElt);

        this.input = inputElt;
        return containerElt;
    }
}
