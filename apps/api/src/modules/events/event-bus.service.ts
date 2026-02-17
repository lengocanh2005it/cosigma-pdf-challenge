import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class EventBusService {
  private subjects = new Map<string, Subject<any>>();

  private getSubject(channel: string): Subject<any> {
    if (!this.subjects.has(channel)) {
      this.subjects.set(channel, new Subject<any>());
    }
    return this.subjects.get(channel)!;
  }

  emit<T = any>(channel: string, data: T) {
    this.getSubject(channel).next(data);
  }

  on<T = any>(channel: string): Observable<T> {
    return this.getSubject(channel).asObservable();
  }
}
