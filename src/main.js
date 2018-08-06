import Vue from 'vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI);

import VueClipboards from 'vue-clipboards';
Vue.use(VueClipboards);
import App from './App.vue'

new Vue({
  el: '#app',
  render: h => h(App)
})
