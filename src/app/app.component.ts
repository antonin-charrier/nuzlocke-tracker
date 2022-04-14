import { Component, OnInit } from '@angular/core';
import { NamedAPIResource, NamedAPIResourceList, PokemonClient, PokemonSpecies } from 'pokenode-ts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  pokemons: { id: string, name: string }[] = [];
  selectedPokemon: { id: string, name: string } | undefined = undefined;

  api = new PokemonClient({
    cacheOptions: { maxAge: 30 * 60 * 1000, exclude: { query: false } },
  });

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
          id: pokemonData.name,
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
    console.log('add to team', this.selectedPokemon);
  }

  addToBox() {
    console.log('add to box', this.selectedPokemon);
  }

  isNamedAPIResource(object: any): object is NamedAPIResource {
    return !!object.name;
  }
}
