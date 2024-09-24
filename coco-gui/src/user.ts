export namespace user {

  export class User {

    id: string;
    username: string;
    roles: Set<number>;
    data: Record<string, any>;

    constructor(id: string, username: string, roles: Set<number>, data: Record<string, any> = {}) {
      this.id = id;
      this.username = username;
      this.roles = roles;
      this.data = data;
    }
  }
}