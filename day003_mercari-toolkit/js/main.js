// NOTE: ES Modules require a local server (not file://)
// Run: python3 -m http.server 8080

import './utils.js';    // side effect: registers sidebar/modal event listeners
import './apiKey.js';   // side effect: registers API key UI event listeners
import { initTemplateTab } from './tab-template.js';
import { initShippingTab } from './tab-shipping.js';
import { initTitleTab }    from './tab-title.js';
import { initPhotoTab }    from './tab-photo.js';
import { switchTab }       from './utils.js';

initTemplateTab();
initShippingTab();
initTitleTab();
initPhotoTab();

switchTab(location.hash.replace('#', '') || 'template');
