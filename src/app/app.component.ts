import { Component, OnInit } from '@angular/core';
import { Unsubscribe } from 'firebase/firestore';
import { NamedAPIResource, NamedAPIResourceList, PokemonClient, PokemonSpecies } from 'pokenode-ts';
import { Pokemon } from './pokemon';
import { PokemonService } from './pokemon.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
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

  constructor(
    private pokemonService: PokemonService
  ) { }

  async ngOnInit(): Promise<void> {
    const data = await this.api.listPokemonSpecies(0, 10000);
    await this.getFrenchName(data);
    this.teamUnsub = this.pokemonService.subscribeToTeam(team => {
      this.team = team;
      this.fillPokemonModels(team);
    });
    this.reserveUnsub = this.pokemonService.subscribeToReserve(reserve => {
      this.reserve = reserve;
      this.fillPokemonModels(reserve);
    });
    this.cemeteryUnsub = this.pokemonService.subscribeToCemetery(cemetery => {
      this.cemetery = cemetery;
      this.fillPokemonModels(cemetery);
    });
  }

  async getFrenchName(data: NamedAPIResourceList) {
    data.results.forEach(async (pokemon) => {
      if (this.isNamedAPIResource(pokemon)) {
        const pokemonData = await this.api.getPokemonSpeciesByName(pokemon.name);
        this.pokemons = [...this.pokemons, {
          id: pokemonData.id,
          name: this.getFullName(pokemonData)
        }];
      }
    });
  }

  getFullName(pokemon: PokemonSpecies): string {
    const id = pokemon.id.toString().padStart(3, '0');
    const frName = pokemon.names.find(name => name.language.name === 'fr');
    const enName = pokemon.names.find(name => name.language.name === 'en');
    return `${id} - ${frName?.name} / ${enName?.name}`;
  }

  addToTeam() {
    if (!this.selectedPokemon) { return; }

    const pokemon = new Pokemon({
      id: this.selectedPokemon,
      level: 1,
      gender: 'male',
      name: 'titu'
    });
    this.pokemonService.addToTeam(pokemon);
  }

  addToReserve() {
    if (!this.selectedPokemon) { return; }

    const pokemon = new Pokemon({
      id: this.selectedPokemon,
      level: 1,
      gender: 'male',
      name: 'titu'
    });
    this.pokemonService.addToReserve(pokemon);
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
}
