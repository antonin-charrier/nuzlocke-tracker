import { Component, OnInit } from '@angular/core';
import { Unsubscribe } from 'firebase/firestore';
import { ChainLink, EvolutionChain, EvolutionClient, NamedAPIResource, NamedAPIResourceList, PokemonClient, PokemonSpecies } from 'pokenode-ts';
import { environment } from 'src/environments/environment';
import { Pokemon } from './pokemon';
import { PokemonService } from './pokemon.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  session: string | null = null;
  loaded = false;
  version = '0.0.1';
  sessionAttempt = '';
  invalidSession = false;
  pokemons: { id: number, name: string }[] = [];
  selectedPokemon: number | undefined = undefined;
  teamUnsub: Unsubscribe | undefined;
  team: any[] = [];
  reserveUnsub: Unsubscribe | undefined;
  reserve: any[] = [];
  cemeteryUnsub: Unsubscribe | undefined;
  cemetery: any[] = [];
  genders = [
    {
      name: 'Male',
      id: 'male'
    },
    {
      name: 'Female',
      id: 'female'
    },
    {
      name: 'None',
      id: 'none'
    }
  ]

  api = new PokemonClient({
    cacheOptions: { maxAge: 30 * 60 * 1000, exclude: { query: false } },
  });
  evoApi = new EvolutionClient({
    cacheOptions: { maxAge: 30 * 60 * 1000, exclude: { query: false } },
  });

  constructor(
    private pokemonService: PokemonService
  ) { }

  async ngOnInit(): Promise<void> {
    this.version = environment.version;
    this.session = this.pokemonService.retrieveSession();
    if (this.session) {
      this.pokemonService.saveSession(this.session);

      await this.retrieveData();
    }
  }

  async retrieveData() {
    this.pokemons = [];
    const data = await this.api.listPokemonSpecies(0, 10000);
    await this.getFrenchName(data);
    this.teamUnsub = this.pokemonService.subscribeToTeam(team => {
      this.team = team;
      this.fillPokemonModels(team);
      this.fillPokemonEvolutions(team);
    });
    this.reserveUnsub = this.pokemonService.subscribeToReserve(reserve => {
      this.reserve = reserve;
      this.fillPokemonModels(reserve);
      this.fillPokemonEvolutions(reserve);
    });
    this.cemeteryUnsub = this.pokemonService.subscribeToCemetery(cemetery => {
      this.cemetery = cemetery;
      this.fillPokemonModels(cemetery);
      this.fillPokemonEvolutions(cemetery);
    });
    this.loaded = true;
  }

  async attemptSession() {
    if (!this.sessionAttempt) { return; }
    this.invalidSession = false;
    const success = await this.pokemonService.attemptSession(this.sessionAttempt);
    if (success) {
      this.session = this.sessionAttempt;
      await this.retrieveData();
    } else {
      this.sessionAttempt = '';
      this.invalidSession = true;
    }
  }

  async closeSession() {
    this.pokemonService.closeSession();
    this.session = null;
  }

  async deleteSession() {
    if (confirm("Are you sure to want to PERMANENTLY delete your session?")) {
      for (const pokemon of this.team) {
        await this.pokemonService.removeFromTeam(pokemon);
      }
      for (const pokemon of this.reserve) {
        await this.pokemonService.removeFromReserve(pokemon);
      }
      for (const pokemon of this.cemetery) {
        await this.pokemonService.removeFromCemetery(pokemon);
      }
      await this.pokemonService.deleteSession();
      await this.closeSession();
      this.sessionAttempt = '';
    }
  }

  async newSession() {
    const session = await this.pokemonService.createSession();
    if (session) {
      this.session = session.id;
      this.pokemonService.saveSession(session.id);
      this.pokemonService.storeSession(session.id);
      await this.retrieveData();
    }
  }

  copySession() {
    if (!this.session) { return; }
    navigator.clipboard.writeText(this.session);
  }

  async getFrenchName(data: NamedAPIResourceList) {
    for (const pokemon of data.results) {
      if (this.isNamedAPIResource(pokemon)) {
        const pokemonData = await this.api.getPokemonSpeciesByName(pokemon.name);
        this.pokemons = [...this.pokemons, {
          id: pokemonData.id,
          name: this.getFullName(pokemonData)
        }];
      }
    }
  }

  getFullName(pokemon: PokemonSpecies): string {
    const id = pokemon.id.toString().padStart(3, '0');
    const frName = pokemon.names.find(name => name.language.name === 'fr');
    const enName = pokemon.names.find(name => name.language.name === 'en');
    return `${id} - ${frName?.name} / ${enName?.name}`;
  }

  async generatePokemon(): Promise<Pokemon | undefined> {
    if (!this.selectedPokemon) { return undefined; }
    const poke = await this.api.getPokemonSpeciesById(this.selectedPokemon);
    const name = poke.names.find(name => name.language.name === 'en');

    const pokemon = new Pokemon({
      id: this.selectedPokemon,
      level: 1,
      gender: 'male',
      name: name ? name.name : 'Brad Pitt'
    });
    this.selectedPokemon = undefined;
    return pokemon;
  }

  async addToTeam() {
    const pokemon = await this.generatePokemon()
    if (pokemon) {
      this.pokemonService.addToTeam(pokemon);
    }
  }

  async addToReserve() {
    const pokemon = await this.generatePokemon()
    if (pokemon) {
      this.pokemonService.addToReserve(pokemon);
    }
  }

  sendToTeam(pokemon: Pokemon) {
    if (this.team.length >= 6) { return; }
    this.pokemonService.sendToTeam(pokemon);
  }

  sendToReserve(pokemon: Pokemon) {
    this.pokemonService.sendToReserve(pokemon);
  }

  sendToCemetery(pokemon: Pokemon) {
    this.pokemonService.sendToCemetery(pokemon);
  }

  isNamedAPIResource(object: any): object is NamedAPIResource {
    return !!object.name;
  }

  fillPokemonModels(pokemons: any[]) {
    (async () => {
      for (const pokemon of pokemons) {
        const poke = await this.api.getPokemonById(pokemon.id);
        pokemon.image = `assets/img/pokemon/models/${poke.name}.gif`;
      }
    })();
  }

  fillPokemonEvolutions(pokemons: any[]) {
    (async () => {
      for (const pokemon of pokemons) {
        const poke = await this.api.getPokemonSpeciesById(pokemon.id);
        if (!poke.evolution_chain || !poke.evolution_chain.url) { continue; }
        const evoChain = 'evolution-chain/';
        const startIndex = poke.evolution_chain.url.lastIndexOf(evoChain) + evoChain.length;
        const endIndex = poke.evolution_chain.url.lastIndexOf('/');
        const id = poke.evolution_chain.url.substring(startIndex, endIndex);
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId)) { continue; }
        const evolution = await this.evoApi.getEvolutionChainById(parsedId);
        pokemon.evolutions = [];
        this.getEvolutions(pokemon, evolution.chain);
      }
    })();
  }

  async getEvolutions(pokemon: any, chain: ChainLink) {
    const poke = await this.api.getPokemonSpeciesByName(chain.species.name);
    if (pokemon.id !== poke.id) {
      pokemon.evolutions = [...pokemon.evolutions, this.pokemons.find(p => p.id === poke.id)];
    }
    for (const evo of chain.evolves_to) {
      this.getEvolutions(pokemon, evo);
    }
  }

  updateGender(pokemon: Pokemon, location: 'team' | 'reserve' | 'cemetery',
      gender: 'male' | 'female' | 'none') {
    pokemon.gender = gender;
    this.pokemonService.updateGender(pokemon, location);
  }

  updateName(pokemon: any, location: 'team' | 'reserve' | 'cemetery') {
    pokemon.editName = false;
    this.pokemonService.updateName(pokemon, location);
  }

  updateLevel(pokemon: any, location: 'team' | 'reserve' | 'cemetery') {
    pokemon.editLevel = false;
    this.pokemonService.updateLevel(pokemon, location);
  }

  addLevel(pokemon: any, location: 'team' | 'reserve' | 'cemetery') {
    if (pokemon.level >= 100) { return; }
    pokemon.level++;
    this.updateLevel(pokemon, location);
  }

  removeLevel(pokemon: any, location: 'team' | 'reserve' | 'cemetery') {
    if (pokemon.level === 1) { return; }
    pokemon.level--;
    this.updateLevel(pokemon, location);
  }

  updateId(pokemon: any, id: number, location: 'team' | 'reserve' | 'cemetery') {
    pokemon.id = id;
    this.pokemonService.updateId(pokemon, location);
  }

  delete(pokemon: any, location: 'team' | 'reserve' | 'cemetery') {
    if (!pokemon || !pokemon.uid) { return; }
    switch (location) {
      case 'team':
        this.pokemonService.removeFromTeam(pokemon);
        return;
      case 'reserve':
        this.pokemonService.removeFromReserve(pokemon);
        return;
      case 'cemetery':
        this.pokemonService.removeFromCemetery(pokemon);
        return;
    }
  }
}
