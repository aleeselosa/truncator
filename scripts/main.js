import Truncator from './truncator.js';

let truncator = new Truncator({classes: ['.truncate'], limit: 300, truncationChars: '...' });
truncator.truncate();