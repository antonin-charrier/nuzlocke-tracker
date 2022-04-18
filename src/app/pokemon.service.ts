import { Injectable } from '@angular/core';
import { doc, Firestore, onSnapshot } from '@angular/fire/firestore';
import { addDoc, collection, deleteDoc, deleteField, updateDoc } from 'firebase/firestore';
import { Pokemon, pokemonConverter } from './pokemon';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  session = '2VopSkQRar9K3EJW3p9R';

  constructor(
    private firestore: Firestore
  ) { }

  public subscribeToTeam(callback: (team: any[]) => void) {
    const ref = collection(this.firestore, `sessions/${this.session}/team`)
      .withConverter(pokemonConverter);
    return onSnapshot(ref, (querySnapshot) => {
      callback(querySnapshot.docs.slice(0, 6).map(doc => doc.data()));
    });
  }

  public async addToTeam(pokemon: Pokemon): Promise<void> {
    const ref = collection(this.firestore,
      `sessions/${this.session}/team`)
      .withConverter(pokemonConverter);
    try {
      await addDoc(ref, pokemon);
    }
    catch (error) {
      console.error('Error adding Pokémon to team', error);
    }
  }

  public async sendToTeam(pokemon: Pokemon): Promise<void> {
    await this.addToTeam(pokemon);
    await this.removeFromReserve(pokemon);
    await this.removeFromCemetery(pokemon);
  }

  public async removeFromTeam(pokemon: Pokemon): Promise<void> {
    const ref = doc(this.firestore,
      `sessions/${this.session}/team/${pokemon.uid}`);
    try {
      await deleteDoc(ref);
    }
    catch (error) {
      console.error('Error deleting Pokémon from team', error);
    }
  }

  public subscribeToReserve(callback: (reserve: any[]) => void) {
    const ref = collection(this.firestore, `sessions/${this.session}/reserve`)
      .withConverter(pokemonConverter);
    return onSnapshot(ref, (querySnapshot) => {
      callback(querySnapshot.docs.map(doc => doc.data()));
    });
  }

  public async addToReserve(pokemon: Pokemon): Promise<void> {
    const ref = collection(this.firestore,
      `sessions/${this.session}/reserve`)
      .withConverter(pokemonConverter);
    try {
      await addDoc(ref, pokemon);
    }
    catch (error) {
      console.error('Error adding Pokémon to reserve', error);
    }
  }

  public async sendToReserve(pokemon: Pokemon): Promise<void> {
    await this.addToReserve(pokemon);
    await this.removeFromTeam(pokemon);
    await this.removeFromCemetery(pokemon);
  }

  public async removeFromReserve(pokemon: Pokemon): Promise<void> {
    const ref = doc(this.firestore,
      `sessions/${this.session}/reserve/${pokemon.uid}`);
    try {
      await deleteDoc(ref);
    }
    catch (error) {
      console.error('Error deleting Pokémon from reserve', error);
    }
  }

  public subscribeToCemetery(callback: (cemetery: any[]) => void) {
    const ref = collection(this.firestore, `sessions/${this.session}/cemetery`)
      .withConverter(pokemonConverter);
    return onSnapshot(ref, (querySnapshot) => {
      callback(querySnapshot.docs.map(doc => doc.data()));
    });
  }

  public async addToCemetery(pokemon: Pokemon): Promise<void> {
    const ref = collection(this.firestore,
      `sessions/${this.session}/cemetery`)
      .withConverter(pokemonConverter);
    try {
      await addDoc(ref, pokemon);
    }
    catch (error) {
      console.error('Error adding Pokémon to cemetery', error);
    }
  }

  public async sendToCemetery(pokemon: Pokemon): Promise<void> {
    await this.addToCemetery(pokemon);
    await this.removeFromTeam(pokemon);
    await this.removeFromReserve(pokemon);
  }

  public async removeFromCemetery(pokemon: Pokemon): Promise<void> {
    const ref = doc(this.firestore,
      `sessions/${this.session}/cemetery/${pokemon.uid}`);
    try {
      await deleteDoc(ref);
    }
    catch (error) {
      console.error('Error deleting Pokémon from cemetery', error);
    }
  }

  public async updateGender(pokemon: Pokemon, location: 'team' | 'reserve' | 'cemetery'): Promise<void> {
    const ref = doc(this.firestore,
      `sessions/${this.session}/${location}/${pokemon.uid}`);

    await updateDoc(ref, { gender: pokemon.gender });
  }

  public async updateName(pokemon: Pokemon, location: 'team' | 'reserve' | 'cemetery'): Promise<void> {
    const ref = doc(this.firestore,
      `sessions/${this.session}/${location}/${pokemon.uid}`);

    await updateDoc(ref, { name: pokemon.name });
  }

  public async updateLevel(pokemon: Pokemon, location: 'team' | 'reserve' | 'cemetery'): Promise<void> {
    const ref = doc(this.firestore,
      `sessions/${this.session}/${location}/${pokemon.uid}`);

    await updateDoc(ref, { level: pokemon.level });
  }
}
