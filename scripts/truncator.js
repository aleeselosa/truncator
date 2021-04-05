export default class Truncator {

    // Param default { classes:['.truncate'], limit: 200, truncationChars: '...', }
    constructor (params) {
        this.classes = params.classes || ['.truncate'];
        this.elements = document.querySelectorAll(this.classes.join(', '));
        this.limit = params.limit ? Math.abs(params.limit) : 200;
        this.truncationChars = params.truncationChars || '...';
    }

    truncate() {
        if(this.elements.length) {

            this.elements.forEach(element => {

                let htmlContent = element.innerHTML.trim(),
                    textContent = element.textContent.trim(),
                    truncatedTextContent = textContent.slice(0, this.limit);
                
                // Cutting content after a word    
                truncatedTextContent = truncatedTextContent.substr(0, Math.min(truncatedTextContent.length, truncatedTextContent.lastIndexOf(' ')));

                if (textContent.length > this.limit) {

                    let tags = this._enlistTags(htmlContent);
                    let truncatedHtmlString = this._assembleTruncatedContent(tags, truncatedTextContent);

                    element.innerHTML = truncatedHtmlString;
                }
            });
        }
    }

    _enlistTags(htmlContent) {
        const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
        let tags = [];
        let isOpenTag = false;
        let currentTagLevel = 0;
        let tempTag = {
            startPos: 0,
            length: 0,
            tag: '',
            level: 0,
            'base-tag': '',
            'tag-name': '',
            'tag-type': ''
        };

        for (let pos = 0; pos < htmlContent.length; pos++) {
            let char = htmlContent.charAt(pos);
            
            switch (char) {
                case '<':
                    isOpenTag = true;
                    tempTag.startPos = pos;
                    break;

                case '>':
                    tempTag.tag += char;
                    tempTag.length++;
                    tempTag['base-tag'] = tempTag.tag.indexOf(' ') > -1 ? tempTag.tag.substr(0,tempTag.tag.indexOf(' ')) + '>' : tempTag.tag;
                    tempTag['tag-name'] = tempTag['base-tag'].replace(/[^a-zA-Z ]/g, '');

                    // Checks if Self Closing Tag or Void Elements
                    if (new RegExp(voidElements.join("|")).test(tempTag['base-tag'])) {
                        currentTagLevel++;
                        tempTag.level = currentTagLevel;
                        tempTag['tag-type'] = 'void-element';
                        currentTagLevel--;
                    } 
                    else {
                        if (tempTag['base-tag'].indexOf('/') > -1)  {
                            tempTag.level = currentTagLevel;
                            tempTag['tag-type'] = 'closing';
                            currentTagLevel--;
                        }
                        else {
                            currentTagLevel++;
                            tempTag.level = currentTagLevel;
                            tempTag['tag-type'] = 'opening';
                        }
                    }
                    
                    tags.push(tempTag);

                    // Reset properties
                    isOpenTag = false;
                    tempTag = {
                        startPos: 0,
                        length: 0,
                        tag: '',
                        level: 0,
                        'base-tag': '',
                        'tag-name': '',
                        'tag-type': ''
                    };
                    break;
            }
            
            if(isOpenTag) {
                tempTag.length++;
                tempTag.tag += char;
            }
        }
        return tags;
    }

    _assembleTruncatedContent(tags, truncatedTextContent) {
        let truncatedHtmlString = truncatedTextContent + this.truncationChars;
        if (tags.length) {
            tags.forEach((tagItem, index) => {           
                if(tagItem.startPos < truncatedTextContent.length) {
                    truncatedHtmlString = truncatedHtmlString.slice(0,tagItem.startPos) + tagItem.tag + 
                                        truncatedHtmlString.slice(tagItem.startPos);
                }
                else {
                    let openingTagItem = tags[this._getOpeningTagIndex(tags, tagItem, index)];
                    if(tagItem['tag-type'] == 'void-element' || tagItem['tag-type'] == 'opening' || tagItem['tag-type'] == 'closing' && openingTagItem.startPos > truncatedHtmlString.length) {
                        return false;
                    }
                    else {
                        truncatedHtmlString = truncatedHtmlString.slice(0,tagItem.startPos) + tagItem.tag + 
                                            truncatedHtmlString.slice(tagItem.startPos);
                    }
                }
            });
        }
        return truncatedHtmlString;
    }

    _getOpeningTagIndex(tags, currentElement, currentElementIndex) {
        for (let pos = currentElementIndex - 1; pos >= 0; pos--) {
            let tagItem = tags[pos];
            if(currentElement['tag-name'] == tagItem['tag-name'] && currentElement.level == tagItem.level) {
                return pos;
                break;
            }
        }
    }
}