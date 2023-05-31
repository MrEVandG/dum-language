import { RuntimeValue } from "./values.ts";

export default class Environment {

    public parent?:Environment;
    private variables:Map<string, RuntimeValue>;
    private constantVariables:Set<string>;
    constructor (parent?:Environment) {
        this.parent = parent;
        this.variables = new Map()
        this.constantVariables = new Set();
    }

    public declareVariable(name:string,value:RuntimeValue,constant:boolean):RuntimeValue {
        if (this.variables.has(name)) {
            throw `${name} is already defined`
        }
        this.variables.set(name,value)
        if (constant) {
            this.constantVariables.add(name)
        }
        return value
    }

    public reassignVariable(name:string,value:RuntimeValue):RuntimeValue {
        if (this.constantVariables.has(name)) {
            throw (`Cannot reassign constant variables. ${name}`)
        }
        this.findVariable(name).variables.set(name,value)
        return value
    }
    /**
     * Find an enviornment containing the variable name.
     *
     * @param {string} name
     * @return {*}  {Environment}
     * @memberof Environment
     */
    public findVariable(name:string):Environment {
        if (this.variables.has(name)) {
            return this
        }
        if (this.parent==undefined) {
            throw (`Cannot find ${name} in any environment. Change the name, owo`)
        }
        return this.parent.findVariable(name)
    }

    public valueOfVariable(name:string):RuntimeValue {
        return this.findVariable(name).variables.get(name) as RuntimeValue
    }
}