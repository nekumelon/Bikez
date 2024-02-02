import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Component, createRef } from 'react';
import './HorizontalSelector.scss';

class HorizontalSelector extends Component {
	constructor({ value }) {
		super();

		this.state = {
			selected: value ?? 0,
		};
	}

	onSelect(index) {
		const { onSelect } = this.props;
		this.setState({ selected: index });

		if (onSelect) {
			onSelect(index);
		}
	}

	render() {
		const { options, className, ...rest } = this.props;

		return (
			<div className={`horizontal-selector ${className}`} {...rest}>
				{options.map((option, index) => {
					const button = (
						<button
							onClick={this.onSelect.bind(this, index)}
							key={index}
							className={`horizontal-selector-option ${
								this.state.selected === index &&
								'horizontal-selector-option-selected'
							}`}>
							{option.icon && (
								<FontAwesomeIcon icon={option.icon} />
							)}
							{option.label}
						</button>
					);

					return index !== options.length - 1 ? (
						<>
							{button}
							<div className='seperator' key={-index - 1}>
								<div className='seperator-line' />
							</div>
						</>
					) : (
						button
					);
				})}
			</div>
		);
	}
}

export default HorizontalSelector;
