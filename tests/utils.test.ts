import { describe, expect, test } from "vitest";

import * as time from "../src/electron/frontend/utils/time";
import * as url from "../src/electron/frontend/utils/url";
import * as bytes from "../src/electron/frontend/utils/bytes";
import * as text from "../src/electron/frontend/utils/text";
import * as typecheck from "../src/electron/frontend/utils/typecheck";
import * as random from "../src/electron/frontend/utils/random";

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('URL Utilities', () => {
  let originalLocation: Location;
  let originalHistory: History;

  beforeEach(() => {
    // Save the original location and history objects
    originalLocation = global.location;
    originalHistory = global.history;

    // Mock location object
    global.location = {
      search: '',
      pathname: '/test',
    };

    // Mock history object
    global.history = {
      state: {},
      pushState: vi.fn(),
    };

  });

  afterEach(() => {
    // Restore the original location and history objects
    global.location = originalLocation;
    global.history = originalHistory;
  });

  it('should add new parameters to the URL', () => {
    url.updateURLParams({ foo: 'bar' });
    expect(global.history.pushState).toHaveBeenCalledWith({ foo: "bar" }, null, '/test?foo=bar');
  });

  it('should update existing parameters in the URL', () => {
    global.location.search = '?foo=old';
    url.updateURLParams({ foo: 'new' });
    expect(global.history.pushState).toHaveBeenCalledWith({ foo: "new" }, null, '/test?foo=new');
  });

  it('should delete parameters from the URL when value is undefined', () => {
    global.location.search = '?foo=bar';
    url.updateURLParams({ foo: undefined });
    expect(global.history.pushState).toHaveBeenCalledWith({}, null, '/test');
  });

  it('should handle multiple parameters correctly', () => {
    global.location.search = '?foo=bar&baz=qux';
    url.updateURLParams({ foo: 'new', baz: undefined, quux: 'corge' });
    expect(global.history.pushState).toHaveBeenCalledWith({ foo: "new", quux: "corge" }, null, '/test?foo=new&quux=corge');
  });

  it('should merge new parameters with existing state', () => {
    global.history.state = { existing: 'value' };
    url.updateURLParams({ foo: 'bar' });
    expect(global.history.state).toEqual({ existing: 'value', foo: 'bar' });
  });

  it('should not change the state if history.state is null', () => {
    global.history.state = null;
    url.updateURLParams({ foo: 'bar' });
    expect(global.history.pushState).toHaveBeenCalledWith(null, null, '/test?foo=bar');
  });
});


describe('Timezone Utilities', () => {
    const originalDateNow = Date.now;
  
    beforeEach(() => {
      Date.now = originalDateNow; // Reset Date.now() mock if it was used
    });
  
    describe('getTimezoneOffset', () => {
      it('should return the correct timezone offset for the local timezone', () => {
        const offset = time.getTimezoneOffset(new Date('2023-06-12T12:00:00Z'));
        expect(offset).toBeTypeOf('number');
      });
  
      it('should return the correct timezone offset for a specific timezone', () => {
        const offset = time.getTimezoneOffset(new Date('2023-06-12T12:00:00Z'), 'America/New_York');
        expect(offset).toBe(14400000); // 4 hours offset in milliseconds
      });
  
      it('should handle string date inputs correctly', () => {
        const offset = time.getTimezoneOffset('2023-06-12T12:00:00Z', 'America/New_York');
        expect(offset).toBe(14400000); // 4 hours offset in milliseconds
      });
    });
  
    describe('formatTimezoneOffset', () => {
      it('should format positive offset correctly', () => {
        const formattedOffset = time.formatTimezoneOffset(-14400000);
        expect(formattedOffset).toBe('+04:00');
      });
  
      it('should format negative offset correctly', () => {
        const formattedOffset = time.formatTimezoneOffset(14400000);
        expect(formattedOffset).toBe('-04:00');
      });
  
      it('should format zero offset correctly', () => {
        const formattedOffset = time.formatTimezoneOffset(0);
        expect(formattedOffset).toBe('+00:00');
      });
    });
  
    describe('getISODateInTimezone', () => {
  
      it('should return the correct ISO date for a specific timezone', () => {
        const isoDate = time.getISODateInTimezone(new Date('2023-06-12T12:00:00Z'), 'America/New_York');
        expect(isoDate).toBe('2023-06-12T08:00:00.000Z'); // Adjusted for 4 hours offset
      });
  
      it('should handle string date inputs correctly', () => {
        const isoDate = time.getISODateInTimezone('2023-06-12T12:00:00Z', 'America/New_York');
        expect(isoDate).toBe('2023-06-12T08:00:00.000Z'); // Adjusted for 4 hours offset
      });
    });

  });

describe('Byte Utilities', () => {
  test('should correctly format bytes', () => {
    const number = 500;
    expect(bytes.humanReadableBytes(number)).toBe('500.00 B');
    expect(bytes.humanReadableBytes(`${number}`)).toBe('500.00 B');
  });

  test('should correctly format kilobytes', () => {
    const number = 1500;
    expect(bytes.humanReadableBytes(number)).toBe('1.50 KB');
    expect(bytes.humanReadableBytes(`${number}`)).toBe('1.50 KB');
  });

  test('should correctly format megabytes', () => {
    const number = 1500000;
    expect(bytes.humanReadableBytes(number)).toBe('1.50 MB');
    expect(bytes.humanReadableBytes(`${number}`)).toBe('1.50 MB');
  });

  test('should correctly format gigabytes', () => {
    const number = 1500000000;
    expect(bytes.humanReadableBytes(number)).toBe('1.50 GB');
    expect(bytes.humanReadableBytes(`${number}`)).toBe('1.50 GB');
  });

  test('should correctly format terabytes', () => {
    const number = 1500000000000;
    expect(bytes.humanReadableBytes(number)).toBe('1.50 TB');
    expect(bytes.humanReadableBytes(`${number}`)).toBe('1.50 TB');
  });

  test('should correctly format petabytes', () => {
    const number = 1500000000000000;
    expect(bytes.humanReadableBytes(number)).toBe('1.50 PB');
    expect(bytes.humanReadableBytes(`${number}`)).toBe('1.50 PB');
  });

  test('should correctly format exabytes', () => {
    const number = 1500000000000000000;
    expect(bytes.humanReadableBytes(number)).toBe('1.50 EB');
    expect(bytes.humanReadableBytes(`${number}`)).toBe('1.50 EB');
  });

  test('should correctly format zettabytes', () => {
    const number = 1500000000000000000000;
    expect(bytes.humanReadableBytes(number)).toBe('1.50 ZB');
    expect(bytes.humanReadableBytes(`${number}`)).toBe('1.50 ZB');
  });

  test('should correctly format yottabytes', () => {
      const number = 1500000000000000000000000;
      expect(bytes.humanReadableBytes(number)).toBe('1.50 YB');
      expect(bytes.humanReadableBytes(`${number}`)).toBe('1.50 YB');
  });

  test('should handle edge cases with 0 bytes', () => {
    const number = 0;
    expect(bytes.humanReadableBytes(number)).toBe('0.00 B');
    expect(bytes.humanReadableBytes(`${number}`)).toBe('0.00 B');
  });

  test('should handle very large numbers appropriately', () => {
    const number = 1e27
    const expected = '1000.00 YB';
    expect(bytes.humanReadableBytes(number)).toBe(expected);
    expect(bytes.humanReadableBytes(`${number}`)).toBe(expected);
  });
});


describe('Text Utilities', () => {

describe('header', () => {
  it('should capitalize and format header strings correctly', () => {
      expect(text.header('hello_world')).toBe('Hello World');
      expect(text.header('HELLO_WORLD')).toBe('HELLO WORLD'); // Do not adjust user-defined capitalization
      expect(text.header('hello world')).toBe('Hello World');
      expect(text.header('api and id')).toBe('API and ID');
      expect(text.header('nwb_or_and')).toBe('NWB or and');
      expect(text.header('nwb or and api')).toBe('NWB or and API');
  });

  it('should handle strings with multiple delimiters correctly', () => {
      expect(text.header('hello_world_and_everyone')).toBe('Hello World and Everyone');
      expect(text.header('api_or_nwb_id')).toBe('API or NWB ID');
      expect(text.header('nwb or_and api')).toBe('NWB or and API');
  });

  it('should handle empty strings', () => {
      expect(text.header('')).toBe('');
  });

  it('should handle strings with only delimiters', () => {
      expect(text.header('_ _')).toBe('');
      expect(text.header('_or_')).toBe('or');
  });

  it('consider words linked with a special character as one word', () => {
      expect(text.header('hello_world-and-all')).toBe('Hello World-and-all');
  });

});

})

describe('Type Check Utilities', () => {
  describe('isNumeric', () => {
    it('should return false for non-string inputs', () => {
        expect(typecheck.isNumericString(123)).toBe(false);
        expect(typecheck.isNumericString(true)).toBe(false);
        expect(typecheck.isNumericString(null)).toBe(false);
        expect(typecheck.isNumericString(undefined)).toBe(false);
        expect(typecheck.isNumericString({})).toBe(false);
        expect(typecheck.isNumericString([])).toBe(false);
    });

    it('should return true for numeric strings', () => {
        expect(typecheck.isNumericString('123')).toBe(true);
        expect(typecheck.isNumericString('123.45')).toBe(true);
        expect(typecheck.isNumericString('-123')).toBe(true);
        expect(typecheck.isNumericString('-123.45')).toBe(true);
        expect(typecheck.isNumericString('0')).toBe(true);
    });

    it('should return false for non-numeric strings', () => {
        expect(typecheck.isNumericString('abc')).toBe(false);
        expect(typecheck.isNumericString('123abc')).toBe(false);
        expect(typecheck.isNumericString('abc123')).toBe(false);
        expect(typecheck.isNumericString('')).toBe(false);
        expect(typecheck.isNumericString(' ')).toBe(false);
    });

    it('should handle strings with spaces', () => {
        expect(typecheck.isNumericString(' 123 ')).toBe(true);
        expect(typecheck.isNumericString(' 123.45 ')).toBe(true);
        expect(typecheck.isNumericString(' -123 ')).toBe(true);
    });

    it('should handle special numeric values', () => {
        expect(typecheck.isNumericString('Infinity')).toBe(true);
        expect(typecheck.isNumericString('-Infinity')).toBe(true);
        expect(typecheck.isNumericString('NaN')).toBe(false);
    });
});
describe('isObject', () => {

  it('should return true for objects', () => {
    expect(typecheck.isObject({})).toBe(true);
    expect(typecheck.isObject({ foo: 'bar' })).toBe(true);
    expect(typecheck.isObject(new Date())).toBe(true);
    expect(typecheck.isObject(Object.create(null))).toBe(true);
  });

  it('should return false for non-objects', () => {
    expect(typecheck.isObject(123)).toBe(false);
    expect(typecheck.isObject('string')).toBe(false);
    expect(typecheck.isObject(true)).toBe(false);
    expect(typecheck.isObject(null)).toBe(false);
    expect(typecheck.isObject(undefined)).toBe(false);
  });

  it('should return false for arrays', () => {
    expect(typecheck.isObject([])).toBe(false);
    expect(typecheck.isObject([1, 2, 3])).toBe(false);
  });

  it('should handle special cases', () => {
    expect(typecheck.isObject(function() {})).toBe(false);
    expect(typecheck.isObject(Symbol('symbol'))).toBe(false);
  });
})


})


describe('Randomization Utilities', () => {

describe('randomIndex', () => {
  it('should return a random index within the given count', () => {
    const count = 10;
    const index = random.randomIndex(count);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(count);
  });

  it('should return 0 for count of 1', () => {
    const count = 1;
    const index = random.randomIndex(count);
    expect(index).toBe(0);
  });
});

describe('getRandomSample', () => {
  it('should return an array with the given count of random elements', () => {
    const array = [1, 2, 3, 4, 5];
    const count = 3;
    const result = random.getRandomSample(array, count);
    expect(result).toHaveLength(count);
    result.forEach(element => {
      expect(array).toContain(element);
    });
  });

  it('should throw an error if count is greater than array length', () => {
    const array = [1, 2, 3];
    const count = 5;
    expect(() => random.getRandomSample(array, count)).toThrow('Array size cannot be smaller than expected random numbers count.');
  });

  it('should not have duplicate elements in the result', () => {
    const array = [1, 2, 3, 4, 5];
    const count = 3;
    const result = random.getRandomSample(array, count);
    const uniqueResult = new Set(result);
    expect(uniqueResult.size).toBe(result.length);
  });

  it('should return an empty array if count is 0', () => {
    const array = [1, 2, 3];
    const count = 0;
    const result = random.getRandomSample(array, count);
    expect(result).toEqual([]);
  });

  it('should return the full array if count equals array length', () => {
    const array = [1, 2, 3];
    const count = array.length;
    const result = random.getRandomSample(array, count);
    expect(result.sort()).toEqual(array.sort());
  });
});

describe('getRandomString', () => {
  it('should return a string', () => {
    const result = random.getRandomString();
    expect(typeof result).toBe('string');
  });

  it('should return a string of expected length', () => {
    const result = random.getRandomString();
    expect(result.length).toBeGreaterThanOrEqual(5); // Length might vary slightly due to the nature of random
    expect(result.length).toBeLessThanOrEqual(11); // Usually the length is around 7-10 characters
  });

  it('should return a different string each time it is called', () => {
    const result1 = random.getRandomString();
    const result2 = random.getRandomString();
    expect(result1).not.toBe(result2);
  });
});

})