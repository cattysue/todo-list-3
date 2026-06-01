import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
  it('입력 필드가 렌더링된다', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('aria-label="할일 검색"이 있다', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.getByLabelText('할일 검색')).toBeInTheDocument();
  });

  it('value prop이 input에 반영된다', () => {
    render(<SearchBar value="테스트" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('테스트');
  });

  it('입력 시 onChange가 호출된다', () => {
    const onChange = jest.fn();
    render(<SearchBar value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '새 검색어' } });
    expect(onChange).toHaveBeenCalledWith('새 검색어');
  });

  it('value가 있을 때 지우기 버튼이 표시된다', () => {
    render(<SearchBar value="검색어" onChange={() => {}} />);
    expect(screen.getByLabelText('검색어 지우기')).toBeInTheDocument();
  });

  it('value가 없을 때 지우기 버튼이 없다', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.queryByLabelText('검색어 지우기')).not.toBeInTheDocument();
  });

  it('지우기 버튼 클릭 시 onChange("")이 호출된다', () => {
    const onChange = jest.fn();
    render(<SearchBar value="검색어" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('검색어 지우기'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('placeholder가 기본값으로 설정된다', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('할일 제목으로 검색...')).toBeInTheDocument();
  });

  it('커스텀 placeholder가 적용된다', () => {
    render(<SearchBar value="" onChange={() => {}} placeholder="커스텀 placeholder" />);
    expect(screen.getByPlaceholderText('커스텀 placeholder')).toBeInTheDocument();
  });
});
