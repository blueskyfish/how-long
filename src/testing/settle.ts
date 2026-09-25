import { ComponentFixture } from '@angular/core/testing';

/**
 * Flushes pending macrotasks and change detection until the Dexie live queries a
 * component subscribes to have delivered their results.
 */
export async function settle(fixture: ComponentFixture<unknown>, cycles = 10): Promise<void> {
  for (let i = 0; i < cycles; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await fixture.whenStable();
    fixture.detectChanges();
  }
}
