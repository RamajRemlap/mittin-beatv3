// lib/MidiInput.ts

type NoteCallback = (note: number, velocity: number) => void;

class MidiInputHandler {
    private midiAccess: any | null = null;
    private onNoteCallback: NoteCallback;
  
    constructor(onNoteCallback: NoteCallback) {
      this.onNoteCallback = onNoteCallback;
      this.init();
    }
  
    async init() {
      if (navigator.requestMIDIAccess) {
        try {
          this.midiAccess = await navigator.requestMIDIAccess();
          console.log('MIDI access granted!');
          this.startListening();
        } catch (error) {
          console.error('Could not access MIDI devices.', error);
        }
      } else {
        console.log('Web MIDI API not supported in this browser.');
      }
    }
  
    private onMIDIMessage = (event: any) => {
      // event.data is a Uint8Array [command, note, velocity]
      const command = event.data[0] >> 4;
      const note = event.data[1];
      let velocity = 0;
      if (event.data.length > 2) {
          velocity = event.data[2];
      }

      // Command 9 is note on. 
      // Some controllers send note on with velocity 0 for note off.
      if (command === 9 && velocity > 0) {
        this.onNoteCallback(note, velocity / 127.0);
      }
    }
  
    startListening() {
      if (!this.midiAccess) return;
      // Using `any` as per existing file's convention
      this.midiAccess.inputs.forEach((entry: any) => {
        entry.onmidimessage = this.onMIDIMessage;
      });
    }
}

export default MidiInputHandler;
