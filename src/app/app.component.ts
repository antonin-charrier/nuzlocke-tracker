import { Component, OnInit } from '@angular/core';
import { NamedAPIResource, NamedAPIResourceList, PokemonClient, PokemonSpecies } from 'pokenode-ts';
import { Pokemon } from './pokemon';
import { PokemonService } from './pokemon.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  session = '2VopSkQRar9K3EJW3p9R';
  team = '0OG4Eul9xVPoe7Fe5ayY';
  reserve = 'G1vNC6baUL41AeA85Pwc';
  pokemons: { id: number, name: string }[] = [];
  selectedPokemon: number | undefined = undefined;

  api = new PokemonClient({
    cacheOptions: { maxAge: 30 * 60 * 1000, exclude: { query: false } },
  });

  constructor(
    private pokemonService: PokemonService
  ) { }

  async ngOnInit(): Promise<void> {
    (async () => {
      await this.api
        .listPokemonSpecies(0, 10000)
        .then(async (data) => await this.getFrenchName(data)) // will output "Luxray"
        .catch((error) => console.error(error));
    })();
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
    this.pokemonService.addToTeam(this.session, this.team, pokemon);
  }

  addToReserve() {
    if (!this.selectedPokemon) { return; }

    const pokemon = new Pokemon({
      id: this.selectedPokemon,
      level: 1,
      gender: 'male',
      name: 'titu'
    });
    this.pokemonService.addToReserve(this.session, this.reserve, pokemon);
  }

  isNamedAPIResource(object: any): object is NamedAPIResource {
    return !!object.name;
  }
}
