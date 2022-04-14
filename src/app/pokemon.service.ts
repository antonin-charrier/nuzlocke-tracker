import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { addDoc, collection } from 'firebase/firestore';
import { Pokemon, pokemonConverter } from './pokemon';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {

  constructor(
    private firestore: Firestore
  ) { }

  public async addToTeam(session: string, team: string, pokemon: Pokemon): Promise<void> {
    const ref = collection(this.firestore,
      `sessions/${session}/team/${team}/pokemons`)
      .withConverter(pokemonConverter);
    try {
      await addDoc(ref, pokemon);
    }
    catch (error) {
      console.error('Error adding Pokémon to team', error);
    }
  }

  public async addToReserve(session: string, reserve: string, pokemon: Pokemon): Promise<void> {
    const ref = collection(this.firestore,
      `sessions/${session}/reserve/${reserve}/pokemons`)
      .withConverter(pokemonConverter);
    try {
      await addDoc(ref, pokemon);
    }
    catch (error) {
      console.error('Error adding Pokémon to team', error);
    }
  }
}
