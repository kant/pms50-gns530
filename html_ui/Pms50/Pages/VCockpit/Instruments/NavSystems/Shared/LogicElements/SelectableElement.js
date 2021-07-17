class SelectableElement {
    constructor(_gps, _element, _callBack) {
        this.isActive = true;
        this.gps = _gps;
        this.element = _element;
        this.callBack = _callBack;
    }
    SendEvent(_event = null, _index = -1) {
        if (_index == -1) {
            return this.callBack(_event);
        }
        else {
            return this.callBack(_event, _index);
        }
    }
    GetElement() {
        return this.element;
    }
    GetLineElement() {
        return this.element;
    }
    updateSelection(_selected) {
        if (!this.isActive) {
            diffAndSetAttribute(this.element, "state", "Greyed");
        }
        else if (_selected) {
            diffAndSetAttribute(this.element, "state", "Selected");
        }
        else {
            diffAndSetAttribute(this.element, "state", "Unselected");
        }
    }
    onSelection(_event) {
        return this.isActive;
    }
    setActive(_active) {
        this.isActive = _active;
        if (_active) {
            diffAndSetAttribute(this.element, "state", "Unselected");
        }
        else {
            if (this.gps.currentSelectableArray && this.gps.currentSelectableArray[this.gps.cursorIndex] == this) {
                let begin = this.gps.cursorIndex;
                this.gps.cursorIndex = (this.gps.cursorIndex + 1) % this.gps.currentSelectableArray.length;
                while (!this.gps.currentSelectableArray[this.gps.cursorIndex].isActive) {
                    this.gps.cursorIndex = (this.gps.cursorIndex + 1) % this.gps.currentSelectableArray.length;
                    if (this.gps.cursorIndex == begin) {
                        this.gps.SwitchToInteractionState(0);
                        return;
                    }
                }
            }
            diffAndSetAttribute(this.element, "state", "Greyed");
        }
    }
}
class DynamicSelectableElement extends SelectableElement {
    constructor(_gps, _elementName, _callback) {
        super(_gps, null, _callback);
        this.elementName = _elementName;
    }
    GetElement() {
        return this.gps.getChildById(this.elementName);
    }
    updateSelection(_selected) {
        if (_selected) {
            diffAndSetAttribute(this.GetElement(), "state", "Selected");
        }
        else {
            diffAndSetAttribute(this.GetElement(), "state", "Unselected");
        }
    }
}
class SelectableElementGroup extends SelectableElement {
    constructor(_gps, _element, _callbacks) {
        super(_gps, _element, null);
        this.callBack = this.onEvent.bind(this);
        this.callbacks = _callbacks;
        this.index = 0;
    }
    onEvent(_event, _index = -1) {
        var result;
        if (this.callbacks[this.index]) {
            if (_index == -1) {
                result = this.callbacks[this.index](_event);
            }
            else {
                result = this.callbacks[this.index](_event, _index);
            }
        }
        if (!result) {
            switch (_event) {
                case "NavigationLargeInc":
                    if (this.index < this.callbacks.length - 1) {
                        this.index++;
                        result = this.skipInexistantElements(true);
                    }
                    else {
                        result = false;
                    }
                    break;
                case "NavigationLargeDec":
                    if (this.index > 0) {
                        this.index--;
                        result = this.skipInexistantElements(false);
                    }
                    else {
                        result = false;
                    }
                    break;
            }
        }
        return result;
    }
    onSelection(_event) {
        if (_event == "NavigationLargeInc") {
            this.index = 0;
            return this.skipInexistantElements(true);
        }
        else if (_event == "NavigationLargeDec") {
            this.index = this.callbacks.length - 1;
            return this.skipInexistantElements(false);
        }
        return true;
    }
    skipInexistantElements(_up = true) {
        let elem;
        do {
            elem = this.element.getElementsByClassName("Select" + this.index)[0];
            if (!elem) {
                this.index += (_up ? 1 : -1);
            }
        } while (!elem && this.index >= 0 && this.index < this.callbacks.length);
        if (this.index == this.callbacks.length || this.index < 0) {
            return false;
        }
        return true;
    }
    updateSelection(_selected) {
        for (let i = 0; i < this.callbacks.length; i++) {
            var element = this.element.getElementsByClassName("Select" + i)[0];
            if (element) {
                if (_selected && i == this.index) {
                    diffAndSetAttribute(element, "state", "Selected");
                }
                else {
                    diffAndSetAttribute(element, "state", "Unselected");
                }
            }
            if (i == this.index && !element) {
                if (!this.skipInexistantElements(true)) {
                    this.skipInexistantElements(false);
                }
            }
        }
    }
    GetElement() {
        return this.element.getElementsByClassName("Select" + this.index)[0];
    }
}
class SelectableElementSliderGroup extends SelectableElement {
    constructor(_gps, _elements, _slider, _cursor, _step = 1, _emptyLine = "") {
        super(_gps, null, null);
        this.stringElements = [];
        this.dataElements = [];
        this.isDisplayLocked = false;
        this.callBack = this.onEvent.bind(this);
        this.elements = _elements;
        this.slider = _slider;
        this.sliderCursor = _cursor;
        this.index = 0;
        this.offset = 0;
        this.step = _step;
        this.emptyLine = _emptyLine;
    }
    onEvent(_event) {
        var result;
        let l = Math.max(this.stringElements.length, this.dataElements.length);
        if (l > 0) {
            result = this.elements[this.index].SendEvent(_event, this.offset + this.index);
            if (!result) {
                switch (_event) {
                    case "NavigationLargeInc":
                        do {
                            if (this.index == this.elements.length - 1) {
                                if ((this.index + this.offset) < l - 1) {
                                    this.offset += this.step;
                                    this.index -= (this.step - 1);
                                    result = true;
                                }
                                else {
                                    result = false;
                                }
                            }
                            else {
                                if (this.index < Math.min(this.elements.length, l) - 1) {
                                    this.index++;
                                    result = true;
                                }
                            }
                        } while (result && !this.elements[this.index].onSelection(_event));
                        break;
                    case "NavigationLargeDec":
                        do {
                            if (this.index == 0) {
                                if (this.offset > 0) {
                                    this.offset -= this.step;
                                    this.index += (this.step - 1);
                                    result = true;
                                }
                                else {
                                    result = false;
                                }
                            }
                            else {
                                this.index--;
                                result = true;
                            }
                        } while (result && !this.elements[this.index].onSelection(_event));
                        break;
                }
            }
        }
        if (this.dataElements.length > this.stringElements.length) {
            this.updateDisplayWithData();
        }
        else {
            this.updateDisplay();
        }
        return result;
    }
    GetElement() {
        return this.elements[this.index].GetElement();
    }
    GetLineElement() {
        return this.elements[this.index].GetLineElement();
    }
    getIndex() {
        return this.offset + this.index;
    }
    getOffset() {
        return this.offset;
    }
    updateSelection(_selected) {
        for (let i = 0; i < this.elements.length; i++) {
            if (_selected && i == this.index) {
                this.elements[i].updateSelection(true);
            }
            else {
                this.elements[i].updateSelection(false);
            }
        }
    }
    getStringElements() {
        return this.stringElements;
    }
    setDataElements(_dataElements) {
        this.dataElements = _dataElements;
        if (this.index < 0) {
            this.index = 0;
        }
        if (this.offset + this.index >= this.dataElements.length) {
            this.offset = Math.max(0, this.dataElements.length - this.elements.length);
            this.index = Math.min(this.dataElements.length, this.elements.length) - 1;
        }
        this.updateDisplayWithData();
    }
    setStringElements(_sElements) {
        if (!this.stringElements) {
            this.stringElements = [];
        }
        for (let i = 0; i < _sElements.length; i++) {
            if (this.stringElements[i] != _sElements[i]) {
                this.stringElements[i] = _sElements[i];
            }
        }
        while (this.stringElements.length > _sElements.length && this.stringElements.length > 0) {
            this.stringElements.pop();
        }
        if (this.index < 0) {
            this.index = 0;
        }
        if (this.offset + this.index >= this.stringElements.length) {
            this.offset = Math.max(0, this.stringElements.length - this.elements.length);
            this.index = Math.min(this.stringElements.length, this.elements.length) - 1;
        }
        this.updateDisplay();
    }
    incrementIndex(_up = true) {
        let result;
        let l = Math.max(this.stringElements.length, this.dataElements.length);
        if (_up) {
            do {
                if (this.index == this.elements.length - 1) {
                    if ((this.index + this.offset) < l - 1) {
                        this.offset += this.step;
                        this.index -= (this.step - 1);
                        result = true;
                    }
                    else {
                        result = false;
                    }
                }
                else {
                    if (this.index < Math.min(this.elements.length, l) - 1) {
                        this.index++;
                        result = true;
                    }
                }
            } while (result && !this.elements[this.index].onSelection("NavigationLargeInc"));
        }
        else {
            do {
                if (this.index == 0) {
                    if (this.offset > 0) {
                        this.offset -= this.step;
                        this.index += (this.step - 1);
                        result = true;
                    }
                    else {
                        result = false;
                    }
                }
                else {
                    this.index--;
                    result = true;
                }
            } while (result && !this.elements[this.index].onSelection("NavigationLargeDec"));
        }
    }
    onSelection(_event) {
        let l = Math.max(this.stringElements.length, this.dataElements.length);
        if (l === 0) {
            return false;
        }
        if (_event == "NavigationLargeInc") {
            this.offset = 0;
            this.index = 0;
        }
        else if (_event == "NavigationLargeDec") {
            this.offset = Math.max(0, l - this.elements.length);
            this.index = Math.min(l, this.elements.length) - 1;
        }
        if (this.dataElements.length > this.stringElements.length) {
            this.updateDisplayWithData();
        }
        else {
            this.updateDisplay();
        }
        if (!this.elements[this.index].onSelection(_event)) {
            this.onEvent(_event);
        }
        return true;
    }
    updateDisplay() {
        if (this.isDisplayLocked) {
            return;
        }
        var nbElements = this.stringElements.length;
        var maxDisplayedElements = this.elements.length;
        if (nbElements > maxDisplayedElements) {
            diffAndSetAttribute(this.slider, "state", "Active");
            diffAndSetAttribute(this.sliderCursor, "style", "height:" + (maxDisplayedElements * 100 / nbElements) +
                "%;top:" + (this.offset * 100 / nbElements) + "%");
        }
        else {
            diffAndSetAttribute(this.slider, "state", "Inactive");
        }
        for (let i = 0; i < Math.min(this.elements.length, this.stringElements.length); i++) {
            diffAndSetHTML(this.elements[i].GetLineElement(), this.stringElements[this.offset + i]);
        }
        for (let i = this.stringElements.length; i < this.elements.length; i++) {
            diffAndSetHTML(this.elements[i].GetLineElement(), this.emptyLine);
        }
    }
    updateDisplayWithData() {
        if (this.isDisplayLocked) {
            return;
        }
        var nbElements = this.dataElements.length;
        var maxDisplayedElements = this.elements.length;
        if (nbElements > maxDisplayedElements) {
            this.slider.setAttribute("state", "Active");
            this.sliderCursor.setAttribute("style", "height:" + (maxDisplayedElements * 100 / nbElements) +
                "%;top:" + (this.offset * 100 / nbElements) + "%");
        }
        else {
            this.slider.setAttribute("state", "Inactive");
        }
        for (let i = 0; i < Math.min(this.elements.length, this.dataElements.length); i++) {
            let data = this.dataElements[this.offset + i];
            let line = this.elements[i].GetLineElement();
            let cells = line.children;
            for (let j = 0; j < 5; j++) {
                let cell = cells.item(j);
                if (!cell) {
                    cell = document.createElement("td");
                    if (j === 1) {
                        cell.classList.add("SelectableElement");
                    }
                    line.appendChild(cell);
                }
                if (cell instanceof HTMLElement) {
                    if (j === 0) {
                        if (data[j]) {
                            if (cell.innerHTML != data[j]) {
                                cell.innerHTML = data[j];
                            }
                            cell.style.visibility = "visible";
                        }
                        else if (data[j] === "") {
                            cell.style.visibility = "hidden";
                        }
                    }
                    else if (cell.innerHTML != data[j]) {
                        cell.innerHTML = data[j];
                    }
                }
            }
        }
        for (let i = this.dataElements.length; i < this.elements.length; i++) {
            if (this.elements[i].GetLineElement().innerHTML != this.emptyLine) {
                this.elements[i].GetLineElement().innerHTML = this.emptyLine;
            }
        }
    }
    addElement(_elem) {
        this.elements.push(_elem);
    }
    lockDisplay() {
        this.isDisplayLocked = true;
    }
    unlockDisplay() {
        this.isDisplayLocked = false;
        this.updateDisplay();
    }
}
//# sourceMappingURL=SelectableElement.js.map