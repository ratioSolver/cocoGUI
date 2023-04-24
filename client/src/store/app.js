// Utilities
import { defineStore } from 'pinia'
import { SolverD3 } from 'ratio-solver/src/solverD3.js'
import { SensorType } from '../sensor.js'
import { SensorD3 } from '../sensorD3.js'
import { nextTick } from 'vue';

export const server = {
  host: 'localhost',
  port: 8080
}

const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;

export const useAppStore = defineStore('app', {
  state: () => ({
    token: localStorage.getItem('token'),
    user: null,
    login_dialog: false,
    sensor_types: new Map(),
    sensors: new Map(),
    solvers: new Map(),
    users: new Map(),
    speech_recognition: new SpeechRecognition(),
    listening: false,
    recognized_text: '',
    recognized_text_snackbar: false,
    speech_synthesis: window.speechSynthesis,
    speaking: false,
  }),
  actions: {
    login(email, password) {
      fetch('http://' + server.host + ':' + server.port + '/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      }).then(res => {
        if (res.status === 200) {
          res.json().then(data => {
            this.token = data.token;
            localStorage.setItem('token', data.token);
          });
          this.login_dialog = false;
        }
      });
    },
    logout() {
      localStorage.removeItem('token');
      this.token = null;
      this.user = null;
      this.sensor_types.clear();
      this.sensors.clear();
      this.solvers.clear();
      this.users.clear();
      this.login_dialog = true;
    },
    connect(url = 'ws://' + server.host + ':' + server.port + '/coco', timeout = 1000) {
      this.socket = new WebSocket(url);
      this.socket.onopen = () => {
        this.socket.send(JSON.stringify({ 'type': 'connect', 'token': this.token }));
      };
      this.socket.onclose = () => {
        setTimeout(() => { this.connect(url, timeout); }, timeout);
      };
      this.socket.onmessage = (msg) => {
        let data = JSON.parse(msg.data);
        switch (data.type) {
          case 'connect':
            if (data.success)
              this.user = data.user;
            else
              this.logout();
            break;
          case 'users':
            this.users.clear();
            for (let user of data.users)
              this.users.set(user.id, user);
            break;
          case 'new_user':
            this.users.set(data.user.id, data.user);
            break;
          case 'updated_user':
            this.users.set(data.user.id, data.user);
            break;
          case 'removed_user':
            this.users.delete(data.user);
            break;
          case 'user_connected':
            this.users.get(data.user).connected = true;
            break;
          case 'user_disconnected':
            this.users.get(data.user).connected = false;
            break;
          case 'sensor_types':
            this.sensor_types.clear();
            for (let sensor_type of data.sensor_types) {
              const parameters = new Map();
              for (let parameter of sensor_type.parameters)
                parameters.set(parameter.name, this.parameter_type(parameter.type));
              this.sensor_types.set(sensor_type.id, new SensorType(sensor_type.id, sensor_type.name, sensor_type.description, parameters));
            }
            break;
          case 'new_sensor_type':
            const parameters = new Map();
            for (let parameter of data.sensor_type.parameters)
              parameters.set(parameter.name, this.parameter_type(parameter.type));
            this.sensor_types.set(data.sensor_type.id, new SensorType(data.sensor_type.id, data.sensor_type.name, data.sensor_type.description, parameters));
            break;
          case 'updated_sensor_type':
            const sensor_type = this.sensor_types.get(data.sensor_type.id);
            sensor_type.name = data.sensor_type.name;
            sensor_type.description = data.sensor_type.description;
            sensor_type.parameters.clear();
            for (let parameter of data.sensor_type.parameters)
              sensor_type.parameters.set(parameter.name, this.parameter_type(parameter.type));
            break;
          case 'removed_sensor_type':
            this.sensor_types.delete(data.sensor_type);
            break;
          case 'sensors':
            this.sensors.clear();
            for (let sensor of data.sensors)
              this.sensors.set(sensor.id, new SensorD3(sensor.id, sensor.name, this.sensor_types.get(sensor.type), sensor.value, sensor.state));
            break;
          case 'new_sensor':
            this.sensors.set(data.sensor.id, data.sensor);
            break;
          case 'updated_sensor':
            this.sensors.set(data.sensor.id, data.sensor);
            break;
          case 'removed_sensor':
            this.sensors.delete(data.sensor);
            break;
          case 'new_sensor_value':
            this.sensors.get(data.sensor).add_value({ 'timestamp': data.timestamp, 'value': data.value });
            break;
          case 'new_sensor_state':
            this.sensors.get(data.sensor).state = data.state;
            break;
          case 'solvers':
            this.solvers.clear();
            for (let solver of data.solvers)
              this.solvers.set(solver.id, new SolverD3(solver.id, solver.name, solver.state));
            nextTick(() => {
              for (let [id, slv] of this.solvers)
                slv.init(this.get_timelines_id(id), this.get_graph_id(id), 1000, 400);
            });
            break;
          case 'new_solver':
            const slv = new SolverD3(data.solver, data.name, data.state);
            this.solvers.set(data.solver, slv);
            nextTick(() => { slv.init(this.get_timelines_id(slv.id), this.get_graph_id(slv.id), 1000, 400); });
            break;
          case 'removed_solver':
            this.solvers.delete(data.solver);
            break;
          case 'state_changed':
            this.solvers.get(data.solver_id).state_changed(data);
            break;
          case 'graph':
            this.solvers.get(data.solver_id).graph(data);
            break;
          case 'flaw_created':
            this.solvers.get(data.solver_id).flaw_created(data);
            break;
          case 'flaw_state_changed':
            this.solvers.get(data.solver_id).flaw_state_changed(data);
            break;
          case 'flaw_cost_changed':
            this.solvers.get(data.solver_id).flaw_cost_changed(data);
            break;
          case 'flaw_position_changed':
            this.solvers.get(data.solver_id).flaw_position_changed(data);
            break;
          case 'current_flaw':
            this.solvers.get(data.solver_id).current_flaw_changed(data);
            break;
          case 'resolver_created':
            this.solvers.get(data.solver_id).resolver_created(data);
            break;
          case 'resolver_state_changed':
            this.solvers.get(data.solver_id).resolver_state_changed(data);
            break;
          case 'current_resolver':
            this.solvers.get(data.solver_id).current_resolver_changed(data);
            break;
          case 'causal_link_added':
            this.solvers.get(data.solver_id).causal_link_added(data);
            break;
          case 'executor_state_changed':
            if (this.solvers.has(data.solver_id))
              this.solvers.get(data.solver_id).executor_state_changed(data);
            break;
          case 'tick':
            this.solvers.get(data.solver_id).tick(data);
            break;
          case 'starting':
            this.solvers.get(data.solver_id).starting(data);
            break;
          case 'ending':
            this.solvers.get(data.solver_id).ending(data);
            break;
          case 'start':
            this.solvers.get(data.solver_id).start(data);
            break;
          case 'end':
            this.solvers.get(data.solver_id).end(data);
            break;
        }
      };
    },
    publish_sensor_value(sensor, value) {
      fetch('http://' + server.host + ':' + server.port + '/sensor/' + sensor, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': this.token
        },
        body: JSON.stringify(value)
      });
    },
    init_speech_recognition() {
      this.speech_recognition.interimResults = true;
      this.speech_recognition.onstart = () => {
        this.listening = true;
        this.recognized_text_snackbar = true;
        if (this.socket && this.socket.readyState === WebSocket.OPEN)
          this.socket.send(JSON.stringify({ 'type': 'listening', 'token': this.token }));
      };
      this.speech_recognition.onend = () => {
        this.listening = false;
        if (this.socket && this.socket.readyState === WebSocket.OPEN)
          this.socket.send(JSON.stringify({ 'type': 'not_listening', 'token': this.token }));
        setTimeout(() => {
          this.recognized_text_snackbar = false;
          this.recognized_text = '';
        }, 2000);
      };
      this.speech_recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        this.recognized_text = text;
        if (event.results[0].isFinal) {
          this.speak(text);
          if (this.socket && this.socket.readyState === WebSocket.OPEN)
            this.socket.send(JSON.stringify({ 'type': 'understand', 'token': this.token, 'text': text, 'confidence': confidence }));
        }
      };
    },
    start_speech_recognition() {
      this.speech_recognition.start();
    },
    speak(text) {
      if (this.speech_synthesis.speaking)
        this.speech_synthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => {
        this.speaking = true;
        if (this.socket && this.socket.readyState === WebSocket.OPEN)
          this.socket.send(JSON.stringify({ 'type': 'speaking', 'token': this.token }));
      };
      utterance.onend = () => {
        this.speaking = false;
        if (this.socket && this.socket.readyState === WebSocket.OPEN)
          this.socket.send(JSON.stringify({ 'type': 'not_speaking', 'token': this.token }));
      };
      this.speech_synthesis.speak(utterance);
    }
  },
  getters: {
    parameter_type: (state) => {
      return (type) => {
        switch (type) {
          case 0: return 'int';
          case 1: return 'float';
          case 2: return 'bool';
          case 3: return 'symbol';
          case 4: return 'string';
          default: return 'unknown';
        }
      };
    },
    input_type: (state) => {
      return (type) => {
        switch (type) {
          case 'int':
          case 'float': return 'number';
          case 'bool': return 'checkbox';
          case 'symbol':
          case 'string': return 'text';
          default: return 'unknown';
        }
      };
    },
    solver_state_icon: (state) => {
      return (type) => {
        switch (type) {
          case 'reasoning':
          case 'adapting': return 'mdi-brain';
          case 'idle': return 'mdi-pause-circle';
          case 'executing': return 'mdi-play-circle';
          case 'finished': return 'mdi-check-circle';
          case 'failed': return 'mdi-alert-circle';
          default: return null;
        }
      };
    },
    get_timelines_id: (state) => { return (id) => 'tls-' + id; },
    get_graph_id: (state) => { return (id) => 'gr-' + id; },
    get_sensor_id: (state) => { return (id) => 'sensor-' + id; },
  }
});