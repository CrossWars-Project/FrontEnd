import setGuestMode from './setGuestMode';

describe('setGuestMode', () => {
  it('clears user and session and sets localStorage guest flag', () => {
    const mockSetUser = jest.fn();
    const mockSetSession = jest.fn();
    Storage.prototype.setItem = jest.fn();

    setGuestMode(mockSetUser, mockSetSession);

    expect(mockSetUser).toHaveBeenCalledWith(null);
    expect(mockSetSession).toHaveBeenCalledWith(null);
    expect(localStorage.setItem).toHaveBeenCalledWith('guest', 'true');
  });
});
