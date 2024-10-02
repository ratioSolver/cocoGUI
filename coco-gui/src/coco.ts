import { taxonomy } from "./taxonomy"
import { rule } from "./rule"
import { solver } from "./solver"
import { reactive } from "vue";
import { Reactive } from "vue";

export namespace coco {

  export class KnowledgeListener {

    constructor() {
    }

    types(types: taxonomy.Type[]) { }
    type_added(type: taxonomy.Type) { }
    type_updated(type: taxonomy.Type) { }
    type_removed(id: string) { }

    items(items: taxonomy.Item[]) { }
    item_added(item: taxonomy.Item) { }
    item_updated(item: taxonomy.Item) { }
    item_removed(id: string) { }

    reactive_rules(rules: rule.ReactiveRule[]) { }
    reactive_rule_added(rule: rule.ReactiveRule) { }
    reactive_rule_updated(rule: rule.ReactiveRule) { }
    reactive_rule_removed(id: string) { }

    deliberative_rules(rules: rule.DeliberativeRule[]) { }
    deliberative_rule_added(rule: rule.DeliberativeRule) { }
    deliberative_rule_updated(rule: rule.DeliberativeRule) { }
    deliberative_rule_removed(id: string) { }

    solvers(solvers: solver.Solver[]) { }
    solver_added(solver: solver.Solver) { }
    solver_removed(id: string) { }
  }

  /**
   * Represents the CoCo knowledge base.
   */
  export class KnowledgeBase {

    user_type: taxonomy.Type | null = null;
    user: taxonomy.Item | null = null;
    ssl: boolean = false;
    auth: boolean = false;
    types: Map<string, taxonomy.Type>;
    items: Map<string, taxonomy.Item>;
    reactive_rules: Map<string, rule.ReactiveRule>;
    deliberative_rules: Map<string, rule.DeliberativeRule>;
    solvers: Map<number, solver.Solver>;
    listeners: Set<KnowledgeListener>;
    static #instance: Reactive<KnowledgeBase>;
    socket: WebSocket | null = null;

    /**
     * Creates a new Knowledge instance.
     */
    private constructor() {
      this.types = new Map();
      this.items = new Map();
      this.reactive_rules = new Map();
      this.deliberative_rules = new Map();
      this.solvers = new Map();
      this.listeners = new Set();
    }

    /**
     * Returns the singleton instance of the KnowledgeBase.
     * 
     * @returns The singleton instance of the KnowledgeBase.
     */
    static getInstance(): Reactive<KnowledgeBase> {
      if (!KnowledgeBase.#instance)
        KnowledgeBase.#instance = reactive<KnowledgeBase>(new KnowledgeBase());
      return KnowledgeBase.#instance;
    }

    /**
     * Initializes the connection settings for the application.
     *
     * @param ssl - A boolean indicating whether SSL should be used.
     * @param auth - A boolean indicating whether authentication is required.
     *
     * If authentication is required and a token is found in local storage,
     * it will attempt to connect using the token. Otherwise, it will connect
     * without authentication.
     */
    init(ssl: boolean, auth: boolean): void {
      this.ssl = ssl;
      this.auth = auth;
      if (this.auth) {
        const token = localStorage.getItem('token');
        if (token)
          this.connect(token);
      } else
        this.connect();
    }

    private update_knowledge(message: any): boolean {
      switch (message.type) {
        case 'user_type':
          this.set_user_type(message);
          return true;
        case 'user':
          this.set_user(message);
          return true;
        case 'types':
          this.set_types(message);
          return true;
        case 'new_type':
          this.add_type(message);
          return true;
        case 'updated_type':
          this.update_type(message);
          return true;
        case 'deleted_type':
          this.remove_type(message);
          return true;
        case 'items':
          this.set_items(message);
          return true;
        case 'new_item':
          this.add_item(message);
          return true;
        case 'updated_item':
          this.update_item(message);
          return true;
        case 'deleted_item':
          this.remove_item(message);
          return true;
        case 'new_data':
          this.add_data(message);
          return true;
        case 'reactive_rules':
          this.set_reactive_rules(message);
          return true;
        case 'new_reactive_rule':
          this.add_reactive_rule(message);
          return true;
        case 'updated_reactive_rule':
          this.update_reactive_rule(message);
          return true;
        case 'deleted_reactive_rule':
          this.remove_reactive_rule(message);
          return true;
        case 'deliberative_rules':
          this.set_deliberative_rules(message);
          return true;
        case 'new_deliberative_rule':
          this.add_deliberative_rule(message);
          return true;
        case 'updated_deliberative_rule':
          this.update_deliberative_rule(message);
          return true;
        case 'deleted_deliberative_rule':
          this.remove_deliberative_rule(message);
          return true;
        case 'solvers':
          this.set_solvers(message.solvers);
          return true;
        case 'solver_state':
          this.solvers.get(message.id)!.set_state(message);
          return true;
        case 'solver_graph':
          this.solvers.get(message.id)!.set_graph(message);
          return true;
        case 'new_solver':
          this.add_solver(message);
          return true;
        case 'deleted_solver':
          this.remove_solver(message);
          return true;
        case 'flaw_created':
          this.solvers.get(message.solver_id)!.create_flaw(message);
          return true;
        case 'flaw_state_changed':
          this.solvers.get(message.solver_id)!.set_flaw_state(message);
          return true;
        case 'flaw_cost_changed':
          this.solvers.get(message.solver_id)!.set_flaw_cost(message);
          return true;
        case 'flaw_position_changed':
          this.solvers.get(message.solver_id)!.set_flaw_position(message);
          return true;
        case 'current_flaw':
          this.solvers.get(message.solver_id)!.set_current_flaw(message);
          return true;
        case 'resolver_created':
          this.solvers.get(message.solver_id)!.create_resolver(message);
          return true;
        case 'resolver_state_changed':
          this.solvers.get(message.solver_id)!.set_resolver_state(message);
          return true;
        case 'current_resolver':
          this.solvers.get(message.solver_id)!.set_current_resolver(message);
          return true;
        case 'causal_link_added':
          this.solvers.get(message.solver_id)!.add_causal_link(message);
          return true;
        case 'solver_execution_state_changed':
          this.solvers.get(message.id)!.set_execution_state(message);
          return true;
        case 'tick':
          this.solvers.get(message.id)!.tick(message);
          return true;
        case 'starting':
          this.solvers.get(message.id)!.starting(message);
          return true;
        case 'ending':
          this.solvers.get(message.id)!.ending(message);
          return true;
        case 'start':
          this.solvers.get(message.id)!.start(message);
          return true;
        case 'end':
          this.solvers.get(message.id)!.end(message);
          return true;
        default:
          return false;
      }
    }

    /**
     * Creates a new user with the given username, password, roles, and additional data.
     * 
     * @param username - The username for the new user.
     * @param password - The password for the new user.
     * @param roles - The roles for the new user. Defaults to an empty array.
     * @param data - Additional data to be associated with the user. Defaults to an empty object.
     * @returns A promise that resolves to the token of the new user if the user was created successfully, or `null` otherwise.
     */
    async create_user(username: string, password: string, roles: number[] = [], data: Record<string, any> = {}): Promise<string | null> {
      const headers: { 'content-type': string, 'authorization'?: string } = { 'content-type': 'application/json' };
      if (this.auth && this.user)
        headers['authorization'] = 'Bearer ' + this.user.id;
      const response = await fetch((this.ssl ? 'https' : 'http') + '://' + location.host + '/user', { method: 'POST', headers: headers, body: JSON.stringify({ username: username, password: password, roles: roles, ...data }) });
      if (response.ok) { // User created successfully
        const data = await response.json();
        return data.token;
      } else { // User creation failed
        const data = await response.json();
        this.error(data.message);
        return null;
      }
    }

    /**
     * Logs in a user with the provided username and password.
     * 
     * @param username - The username of the user attempting to log in.
     * @param password - The password of the user attempting to log in.
     * @returns A promise that resolves to a boolean indicating whether the login was successful.
     */
    async login(username: string, password: string): Promise<boolean> {
      this.user = null;
      const response = await fetch((this.ssl ? 'https' : 'http') + '://' + location.host + '/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: username, password: password }) });
      if (response.ok) { // Login successful
        const data = await response.json();
        localStorage.setItem('token', data.token);
        this.connect(data.token);
        return true;
      } else { // Login failed
        const data = await response.json();
        this.error(data.message);
        return false;
      }
    }

    /**
     * Logs out the current user.
     * 
     * The function removes the token from local storage and sets the user to `null`.
     */
    logout(): void {
      localStorage.removeItem('token');
      this.user = null;
    }

    /**
     * Connects to the CoCo server using WebSocket.
     * 
     * @param timeout The timeout value in milliseconds for reconnecting to the server if the connection is closed. Default is 5000.
     */
    connect(token: string | null = null, timeout = 5000) {
      console.debug('Connecting to CoCo server ' + (this.ssl ? 'wss' : 'ws') + '://' + location.host + '/coco');
      this.socket = new WebSocket((this.ssl ? 'wss' : 'ws') + '://' + location.host + '/coco');
      this.socket.onopen = () => {
        console.debug('Connected to CoCo server');
        if (token) {
          console.debug('Logging in with token', token);
          this.socket!.send(JSON.stringify({ type: 'login', token: token }));
        }
      };
      this.socket.onerror = (event) => {
        console.error('Error connecting to CoCo server', event);
        this.warning('Error connecting to CoCo server');
        setTimeout(() => this.connect(token, timeout), timeout);
      }
      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.debug('Received:', data);
        this.update_knowledge(data);
      };
      this.socket.onclose = () => {
        console.debug('Connection to CoCo server closed');
        this.warning('Connection to CoCo server closed');
        localStorage.removeItem('token');
        this.user = null;
        this.socket = null;
      };
    }

    /**
     * Publishes an item with the provided data.
     * 
     * @param item - The item to be published.
     * @param data - The data to be published.
     */
    publish(item: taxonomy.Item, data: Record<string, any>) {
      console.debug('Publishing', item.id, data);
      const headers: { 'content-type': string, 'authorization'?: string } = { 'content-type': 'application/json' };
      if (this.auth && this.user)
        headers['authorization'] = 'Bearer ' + this.user.id;
      fetch((this.ssl ? 'https' : 'http') + '://' + location.host + '/data/' + item.id, { method: 'POST', headers: headers, body: JSON.stringify(data) }).then(res => {
        if (!res.ok)
          res.json().then(data => this.error(data.message)).catch(err => console.error(err));
      });
    }

    /**
     * Loads data for the specified item within a given time range.
     * 
     * @param item - The item for which to load data.
     * @param from - The start time of the data range in milliseconds. Defaults to 14 days ago.
     * @param to - The end time of the data range in milliseconds. Defaults to the current time.
     */
    load_data(item: taxonomy.Item, from = Date.now() - 1000 * 60 * 60 * 24 * 14, to = Date.now()) {
      console.debug('Loading data for', item.get_name(), 'from', new Date(from), 'to', new Date(to));
      const headers: { 'content-type': string, 'authorization'?: string } = { 'content-type': 'application/json' };
      if (this.auth && this.user)
        headers['authorization'] = 'Bearer ' + this.user.id;
      fetch((this.ssl ? 'https' : 'http') + '://' + location.host + '/data/' + item.id + '?' + new URLSearchParams({ from: from.toString(), to: to.toString() }), { method: 'GET', headers: headers }).then(res => {
        if (res.ok)
          res.json().then(data => this.set_data(item, data));
        else
          res.json().then(data => this.error(data.message)).catch(err => console.error(err));
      });
    }

    /**
     * Retrieves items of a specific type from the server.
     * 
     * @param type - The type of items to retrieve.
     * @returns A promise that resolves to an array of taxonomy items.
     * @throws An error if the server response is not successful.
     */
    async get_items(type: taxonomy.Type): Promise<taxonomy.Item[]> {
      console.debug('Getting items of type', type.name);
      const headers: { 'content-type': string, 'authorization'?: string } = { 'content-type': 'application/json' };
      if (this.auth && this.user)
        headers['authorization'] = 'Bearer ' + this.user.id;
      const response = await fetch((this.ssl ? 'https' : 'http') + '://' + location.host + '/items?type_id=' + type.id, { method: 'GET', headers: headers });
      if (response.ok) {
        const items = await response.json();
        return items.map((item: any) => {
          const type = this.types.get(item.type)!;
          return new taxonomy.Item(item.id, type, item.properties, { timestamp: item.value.timestamp, data: item.value.data });
        });
      }
      else {
        const data = await response.json();
        this.error(data.message);
        throw new Error(data.message);
      }
    }

    private set_user_type(user_type_message: any): void {
      const user_type = user_type_message.user_type;
      const parents = new Map<string, taxonomy.Type>();
      if (user_type.parents)
        for (const parent_id of user_type.parents) {
          const parent = this.types.get(parent_id)!;
          parents.set(parent.id, parent);
        }
      const static_properties = new Map<string, taxonomy.Property>();
      if (user_type.static_properties)
        for (const [prop_name, prop_type] of Object.entries(user_type.static_properties))
          static_properties.set(prop_name, create_property(this, prop_name, prop_type));
      const dynamic_properties = new Map<string, taxonomy.Property>();
      if (user_type.dynamic_properties)
        for (const [prop_name, prop_type] of Object.entries(user_type.dynamic_properties))
          dynamic_properties.set(prop_name, create_property(this, prop_name, prop_type));
      this.user_type = new taxonomy.Type(user_type.id, user_type.name, user_type.description, user_type.properties, parents, static_properties, dynamic_properties);
    }

    private set_user(user_message: any): void {
      const user = user_message.user;
      this.user = new taxonomy.Item(user.id, this.user_type!, user.properties, { timestamp: user.value.timestamp, data: user.value.data });
      localStorage.setItem('token', this.user.id);
    }

    private set_types(types_message: any): void {
      this.types.clear();
      for (const type_message of types_message.types)
        this.types.set(type_message.id, new taxonomy.Type(type_message.id, type_message.name, type_message.description, type_message.properties));
      for (const type_message of types_message.types) {
        const type = this.types.get(type_message.id)!;
        if (type_message.parents)
          for (const parent_id of type_message.parents)
            type.parents.set(parent_id, this.types.get(parent_id)!);
        if (type_message.static_properties)
          for (const [prop_name, prop_type] of Object.entries(type_message.static_properties))
            type.static_properties.set(prop_name, create_property(this, prop_name, prop_type));
        if (type_message.dynamic_properties)
          for (const [prop_name, prop_type] of Object.entries(type_message.dynamic_properties))
            type.dynamic_properties.set(prop_name, create_property(this, prop_name, prop_type));
      }
      this.listeners.forEach(listener => listener.types(Array.from(this.types.values())));
    }

    private add_type(created_type_message: any): void {
      const new_type = created_type_message.new_type;
      const parents = new Map<string, taxonomy.Type>();
      if (new_type.parents)
        for (const parent_id of new_type.parents) {
          const parent = this.types.get(parent_id)!;
          parents.set(parent.id, parent);
        }
      const static_properties = new Map<string, taxonomy.Property>();
      if (new_type.static_properties)
        for (const [prop_name, prop_type] of Object.entries(new_type.static_properties))
          static_properties.set(prop_name, create_property(this, prop_name, prop_type));
      const dynamic_properties = new Map<string, taxonomy.Property>();
      if (new_type.dynamic_properties)
        for (const [prop_name, prop_type] of Object.entries(new_type.dynamic_properties))
          dynamic_properties.set(prop_name, create_property(this, prop_name, prop_type));
      const type = new taxonomy.Type(new_type.id, new_type.name, new_type.description, new_type.properties, parents, static_properties, dynamic_properties);
      this.types.set(type.id, type);
      this.listeners.forEach(listener => listener.type_added(type));
    }

    private update_type(updated_type_message: any): void {
      const updated_type = updated_type_message.updated_type;
      const type = this.types.get(updated_type.id)!;
      if (updated_type.name)
        type.name = updated_type.name;
      if (updated_type.description)
        type.description = updated_type.description;
      if (updated_type.parents) {
        const parents = new Map<string, taxonomy.Type>();
        for (const parent_id of updated_type.parents)
          parents.set(parent_id, this.types.get(parent_id)!);
        type.parents = parents;
      }
      if (updated_type.static_properties) {
        const static_properties = new Map<string, taxonomy.Property>();
        for (const [prop_name, prop_type] of Object.entries(updated_type.static_properties))
          static_properties.set(prop_name, create_property(this, prop_name, prop_type));
        type.static_properties = static_properties;
      }
      if (updated_type.dynamic_properties) {
        const dynamic_properties = new Map<string, taxonomy.Property>();
        for (const [prop_name, prop_type] of Object.entries(updated_type.dynamic_properties))
          dynamic_properties.set(prop_name, create_property(this, prop_name, prop_type));
        type.dynamic_properties = dynamic_properties;
      }
      this.listeners.forEach(listener => listener.type_updated(type));
    }

    private remove_type(removed_type_message: any): void {
      const removed_type_id = removed_type_message.id;
      if (!this.types.delete(removed_type_id))
        console.error(`Type ${removed_type_id} not found`);
      this.listeners.forEach(listener => listener.type_removed(removed_type_id));
    }

    private set_items(items_message: any): void {
      const items = items_message.items;
      this.items.clear();
      for (const item_message of items) {
        const type = this.types.get(item_message.type)!;
        const item = new taxonomy.Item(item_message.id, type, item_message.properties, { timestamp: item_message.value.timestamp, data: item_message.value.data });
        this.items.set(item.id, item);
      }
      this.listeners.forEach(listener => listener.items(Array.from(this.items.values())));
    }

    private add_item(created_item_message: any): void {
      const new_item = created_item_message.new_item;
      const type = this.types.get(new_item.type)!;
      const item = new taxonomy.Item(new_item.id, type, new_item.properties, { timestamp: new_item.value.timestamp, data: new_item.value.data });
      this.items.set(item.id, item);
      this.listeners.forEach(listener => listener.item_added(item));
    }

    private update_item(updated_item_message: any): void {
      const updated_item = updated_item_message.updated_item;
      const item = this.items.get(updated_item.id)!;
      if (updated_item.properties)
        item.properties = updated_item.properties;
      this.listeners.forEach(listener => listener.item_updated(item));
    }

    private remove_item(removed_item_message: any): void {
      const removed_item_id = removed_item_message.id;
      if (!this.items.delete(removed_item_id))
        console.error(`Item ${removed_item_id} not found`);
      this.listeners.forEach(listener => listener.item_removed(removed_item_id));
    }

    protected set_data(item: taxonomy.Item, data_message: any): void {
      const data: taxonomy.Data[] = [];
      for (const i in data_message) {
        const timestamp = new Date(data_message[i].timestamp);
        if (data.length > 0 && timestamp.getTime() == data[data.length - 1].timestamp.getTime())
          data[data.length - 1].data = { ...data[data.length - 1].data, ...data_message[i].data };
        else
          data.push({ timestamp: timestamp, data: data_message[i].data });
      }
      item.set_values(data);
    }

    private add_data(add_data_message: any): void {
      const item = this.items.get(add_data_message.item_id)!;
      const timestamp = new Date(add_data_message.value.timestamp);
      if (item.values.length > 0 && timestamp.getTime() == item.values[item.values.length - 1].timestamp.getTime())
        item.values[item.values.length - 1].data = { ...item.values[item.values.length - 1].data, ...add_data_message.value.data };
      else
        item.add_value({ timestamp: timestamp, data: add_data_message.value.data });
    }

    private set_reactive_rules(reactive_rules_message: any): void {
      const reactive_rules = reactive_rules_message.rules;
      this.reactive_rules.clear();
      for (const reactive_rule_message of reactive_rules) {
        const reactive_rule = new rule.ReactiveRule(reactive_rule_message.id, reactive_rule_message.name, reactive_rule_message.content);
        this.reactive_rules.set(reactive_rule.id, reactive_rule);
      }
      this.listeners.forEach(listener => listener.reactive_rules(Array.from(this.reactive_rules.values())));
    }

    private add_reactive_rule(created_reactive_rule_message: any): void {
      const reactive_rule = new rule.ReactiveRule(created_reactive_rule_message.id, created_reactive_rule_message.name, created_reactive_rule_message.content);
      this.reactive_rules.set(reactive_rule.id, reactive_rule);
      this.listeners.forEach(listener => listener.reactive_rule_added(reactive_rule));
    }

    private update_reactive_rule(updated_reactive_rule_message: any): void {
      const update_reactive_rule = updated_reactive_rule_message.updated_reactive_rule;
      const reactive_rule = this.reactive_rules.get(update_reactive_rule.id)!;
      if (update_reactive_rule.name)
        reactive_rule.name = update_reactive_rule.name;
      if (update_reactive_rule.content)
        reactive_rule.content = update_reactive_rule.content;
      this.listeners.forEach(listener => listener.reactive_rule_updated(reactive_rule));
    }

    private remove_reactive_rule(removed_reactive_rule_message: any): void {
      const removed_reactive_rule_id = removed_reactive_rule_message.id;
      const reactive_rule = this.reactive_rules.get(removed_reactive_rule_id)!;
      this.reactive_rules.delete(removed_reactive_rule_id);
      this.listeners.forEach(listener => listener.reactive_rule_removed(reactive_rule.id));
    }

    private set_deliberative_rules(deliberative_rules_message: any): void {
      const deliberative_rules = deliberative_rules_message.rules;
      this.deliberative_rules.clear();
      for (const deliberative_rule_message of deliberative_rules) {
        const deliberative_rule = new rule.DeliberativeRule(deliberative_rule_message.id, deliberative_rule_message.name, deliberative_rule_message.content);
        this.deliberative_rules.set(deliberative_rule.id, deliberative_rule);
      }
      this.listeners.forEach(listener => listener.deliberative_rules(Array.from(this.deliberative_rules.values())));
    }

    private add_deliberative_rule(created_deliberative_rule_message: any): void {
      const deliberative_rule = new rule.DeliberativeRule(created_deliberative_rule_message.id, created_deliberative_rule_message.name, created_deliberative_rule_message.content);
      this.deliberative_rules.set(deliberative_rule.id, deliberative_rule);
      this.listeners.forEach(listener => listener.deliberative_rule_added(deliberative_rule));
    }

    private update_deliberative_rule(updated_deliberative_rule_message: any): void {
      const update_deliberative_rule = updated_deliberative_rule_message.updated_deliberative_rule;
      const deliberative_rule = this.deliberative_rules.get(update_deliberative_rule.id)!;
      if (update_deliberative_rule.name)
        deliberative_rule.name = update_deliberative_rule.name;
      if (update_deliberative_rule.content)
        deliberative_rule.content = update_deliberative_rule.content;
      this.listeners.forEach(listener => listener.deliberative_rule_updated(deliberative_rule));
    }

    private remove_deliberative_rule(removed_deliberative_rule_message: any): void {
      const removed_deliberative_rule_id = removed_deliberative_rule_message.id;
      const deliberative_rule = this.deliberative_rules.get(removed_deliberative_rule_id)!;
      this.deliberative_rules.delete(removed_deliberative_rule_id);
      this.listeners.forEach(listener => listener.deliberative_rule_removed(deliberative_rule.id));
    }

    private set_solvers(solvers_message: any): void {
      this.solvers.clear();
      for (const solver_message of solvers_message) {
        const slv = new solver.Solver(solver_message.id, solver_message.name, solver.State[solver_message.state as keyof typeof solver.State]);
        this.solvers.set(slv.id, slv);
      }
      this.listeners.forEach(listener => listener.solvers(Array.from(this.solvers.values())));
    }

    private add_solver(created_solver_message: any): void {
      const slv = new solver.Solver(created_solver_message.id, created_solver_message.name, solver.State[created_solver_message.state as keyof typeof solver.State]);
      this.solvers.set(slv.id, slv);
      this.listeners.forEach(listener => listener.solver_added(slv));
    }

    private remove_solver(removed_solver_message: any): void {
      const removed_solver_id = removed_solver_message.id;
      if (!this.solvers.delete(removed_solver_id))
        console.error(`Solver ${removed_solver_id} not found`);
      this.listeners.forEach(listener => listener.solver_removed(removed_solver_id));
    }

    /**
     * Adds a listener to the CoCo object.
     * 
     * @param listener - The listener to be added.
     */
    add_listener(listener: KnowledgeListener): void {
      this.listeners.add(listener);
      listener.types(Array.from(this.types.values()));
      listener.items(Array.from(this.items.values()));
      listener.reactive_rules(Array.from(this.reactive_rules.values()));
      listener.deliberative_rules(Array.from(this.deliberative_rules.values()));
      listener.solvers(Array.from(this.solvers.values()));
    }

    /**
     * Removes a listener from the state.
     * 
     * @param listener - The listener to be removed.
     */
    remove_listener(listener: KnowledgeListener): void {
      this.listeners.delete(listener);
    }

    info(message: string) { }
    error(message: string) { }
    warning(message: string) { }
    loading(message: string) { }
  }

  /**
   * Creates a property based on the given knowledge base, name, and property object.
   * 
   * @param kb - The knowledge base.
   * @param name - The name of the property.
   * @param property - The property object.
   * @returns The created property.
   * @throws Error if the property type is unknown.
   */
  function create_property(kb: KnowledgeBase, name: string, property: any): taxonomy.Property {
    switch (property.type) {
      case "boolean":
        return new taxonomy.BooleanProperty(name, property.default_value);
      case "integer":
        return new taxonomy.IntegerProperty(name, property.min, property.max, property.default_value);
      case "real":
        return new taxonomy.RealProperty(name, property.min, property.max, property.default_value);
      case "string":
        return new taxonomy.StringProperty(name, property.default_value);
      case "symbol":
        return new taxonomy.SymbolProperty(name, property.values, property.multiple, property.default_value);
      case "item":
        return new taxonomy.ItemProperty(name, kb.types.get(property.type_id)!, property.multiple, property.default_value);
      case "json":
        return new taxonomy.JSONProperty(name, property.schema, property.default_value);
      default:
        throw new Error(`Unknown property type: ${property.type}`);
    }
  }
}