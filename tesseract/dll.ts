export class Node<T> {
  public value: T;
  public prev: Node<T>;
  public next: Node<T>;

  constructor(value: T, prev: Node<T> = null, next: Node<T> = null) {
    this.value = value;
    this.prev = prev;
    this.next = next;
  }
}

// ============================================
//  Fucking double linked list data structure.
// ============================================
export class DoubleLinkedList<T> {
  public head: Node<T>;
  public tail: Node<T>;

  constructor() {
    this.head = new Node(null);
    this.tail = this.head;
  }

  /**
  * Test whether a list is empty (only has an empty head and tail).
  */
  isEmpty(): boolean {
    return this.head === this.tail;
  }

  /**
  * Adds a new node as the tail.
  */
  append(value: T): DoubleLinkedList<T> {
    this.insertAfter(this.tail, value);

    return this;
  }

  /**
  * Returns the first value of the list.
  */
  firstValue(): T {
    return this.head.next.value;
  }

  lastValue(): T {
    return this.tail.value;
  }

  insertAfter(afterNode: Node<T>, value: T): Node<T> {
    let currentNextNode = afterNode.next,
    nextNode = new Node(value, afterNode, currentNextNode);

    afterNode.next = nextNode;

    if (currentNextNode !== null) {
      currentNextNode.prev = nextNode;
    } else {
      // 'afterNode' is actually a tail ...
      // ... set 'nextNode' as the new tail of the list.
      this.tail = nextNode;
    }

    return nextNode;
  }

  insertAfterAndDisposeTail(afterNode: Node<T>, value: T): Node<T> {
    let newTailNode: Node<T>;

    if (afterNode === null) {
      afterNode = this.head;
    }

    newTailNode = this.insertAfter(afterNode, value);

    if (newTailNode.next !== null) {
      // Unlink current tail from the new tail node.
      newTailNode.next.prev = null;
      // Unlink current tail.
      newTailNode.next = null;
      // Make new tail actually the new tail :)
      this.tail = newTailNode;
    }

    return newTailNode;
  }

  /**
  * Start a search forwards, and returns a node which satisfies a given predicate.
  *
  * If no such node exists, returns null.
  */
  find(predicate: Function): Node<T> {
    let node = this.head.next;

    while (node !== null) {
      if (predicate(node)) {
        return node;
      }

      node = node.next;
    }

    return null;
  }

  /**
  * Start a search backwards, and returns a node which satisfies a given predicate.
  *
  * If no such node exists, returns null.
  */
  findBackwards(predicate: Function): Node<T> {
    let node = this.tail;

    while (node !== null && node !== this.head) {
      if (predicate(node)) {
        return node;
      }

      node = node.prev;
    }

    return null;
  }

  length(): number {
    let node = this.head.next,
        count = 0;

      while (node !== null) {
        count++;
        node = node.next;
      }

      return count;
  }

  shortenFront(): void {
    let newFirst: Node<T>;

    if (this.isEmpty()) {
      return;
    }

    // discover the next first element.
    newFirst = this.head.next.next;
    // wire next first element to the head of the list (backward link)
    newFirst.prev = this.head;
    // unlink current first element.
    this.head.next.next = null;
    this.head.next.prev = null;
    // link head to the new first element.
    this.head.next = newFirst;
  }
}