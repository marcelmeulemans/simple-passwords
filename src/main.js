import _ from 'lodash';
import Vue from 'vue';
import Vuex from 'vuex';
import injector from 'vue-inject';
import 'vue-awesome/icons';
import Icon from 'vue-awesome/components/Icon';
import PasswordItem from './domain/PasswordItem';
import App from './App';
import StandardfileClient from './standardfile-client';
import '../node_modules/spectre.css/src/spectre.scss';
import '../node_modules/spectre.css/src/spectre-icons.scss';

Vue.component('icon', Icon);
Vue.use(Vuex);

const client = new StandardfileClient('https://standardfile.andrekwakernaak.xyz');

const store = new Vuex.Store({
  state: {
    passwords: {},
    selectedPasswordItemUuid: null
  },
  getters: {
    getPasswordItemByUuid: state => uuid => _.get(state.passwords, uuid),
    getSelectedPasswordItem: state =>
      _.get(state.passwords, state.selectedPasswordItemUuid)
  },
  mutations: {
    addOrUpdate(state, passwordItem) {
      state.passwords = {
        ..._.set(state.passwords, passwordItem.uuid, passwordItem)
      };
    },
    deletePasswordItemByUuid(state, uuid) {
      state.passwords = _.omit(state.passwords, uuid);
    },
    selectPasswordItem(state, uuid) {
      state.selectedPasswordItemUuid = uuid;
    }
  },
  actions: {
    addOrUpdate(context, payLoad) {
      context.commit('addOrUpdate', payLoad);
    },
    saved(context, payLoad) {
      context.commit('addOrUpdate', payLoad);
    },
    delete(context, payLoad) {
      context.commit('deletePasswordItemByUuid', payLoad.uuid);
    },
    selectPasswordItem(context, uuid) {
      context.commit('selectPasswordItem', uuid);
    },
    clearSelectedPasswordItem(context) {
      context.commit('selectPasswordItem', null);
    }
  }
});

client.observerable
  // .filter(item => item.item.content_type === 'password-item')
  .subscribe(
    passwordItem => {
      if (
        passwordItem.item.content_type !== 'password-item' ||
        (!passwordItem.item.content && !passwordItem.item.deleted)
      ) {
        return;
      }
      const content = JSON.parse(passwordItem.item.content);
      const item = new PasswordItem(
        _.assign(content, {
          created_at: passwordItem.item.created_at,
          updated_at: passwordItem.item.updated_at,
          uuid: passwordItem.item.uuid,
          content_type: passwordItem.item.content_type
        })
      );

      store.dispatch(_.camelCase(passwordItem.action), item);
    },
    x => {
      console.error('error', x);
    },
    x => {
      console.info('done', x);
    }
  );

injector.factory('standardfileClient', () => client).lifecycle.application();

Vue.config.productionTip = false;
Vue.use(injector);
/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  template: '<App/>',
  components: { App }
});
